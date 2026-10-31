'use server';

import { db } from '@/db';
import { emailTemplates } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireRole } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { EMAIL_BY_KEY, sampleVarsFor } from '@/lib/email-templates';
import { renderEmail } from '@/lib/email-store';
import { mailConfigured, sendMail } from '@/lib/mailer';

export type EmailActionResult = { ok: boolean; error?: string; message?: string };

/** Create or update one template. Empty subject/body clears the override. */
export async function saveEmailTemplate(
  _prev: EmailActionResult | null,
  formData: FormData,
): Promise<EmailActionResult> {
  await requireRole('management');
  const key = String(formData.get('key') ?? '').trim();
  if (!EMAIL_BY_KEY[key]) return { ok: false, error: 'Unknown email template' };

  const subject = String(formData.get('subject') ?? '').trim();
  const bodyHtml = String(formData.get('bodyHtml') ?? '');
  const enabled = formData.get('enabled') !== null;

  if (!subject) return { ok: false, error: 'The subject line cannot be empty' };
  if (!bodyHtml.trim()) return { ok: false, error: 'The email body cannot be empty' };

  try {
    await db
      .insert(emailTemplates)
      .values({ key, subject, bodyHtml, enabled, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: emailTemplates.key,
        set: { subject, bodyHtml, enabled, updatedAt: new Date() },
      });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (/relation .* does not exist/i.test(message)) {
      return {
        ok: false,
        error: 'The email_templates table is missing. Run the setup SQL (db/email-templates.sql) against your database, then save again.',
      };
    }
    return { ok: false, error: message };
  }

  revalidatePath('/admin/emails');
  return { ok: true, message: enabled ? 'Saved — this email is live.' : 'Saved — this email is switched off.' };
}

/** Drop the customisation and go back to the shipped default. */
export async function resetEmailTemplate(
  _prev: EmailActionResult | null,
  formData: FormData,
): Promise<EmailActionResult> {
  await requireRole('management');
  const key = String(formData.get('key') ?? '').trim();
  if (!EMAIL_BY_KEY[key]) return { ok: false, error: 'Unknown email template' };

  try {
    await db.delete(emailTemplates).where(eq(emailTemplates.key, key));
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Could not reset' };
  }

  revalidatePath('/admin/emails');
  return { ok: true, message: 'Restored the default template.' };
}

/** Send the current editor contents (unsaved changes included) to one address. */
export async function sendTestEmail(
  _prev: EmailActionResult | null,
  formData: FormData,
): Promise<EmailActionResult> {
  await requireRole('management');
  const key = String(formData.get('key') ?? '').trim();
  const to = String(formData.get('to') ?? '').trim();
  const subjectOverride = String(formData.get('subject') ?? '').trim();
  const bodyOverride = String(formData.get('bodyHtml') ?? '');

  if (!EMAIL_BY_KEY[key]) return { ok: false, error: 'Unknown email template' };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) return { ok: false, error: 'Enter a valid email address' };
  if (!mailConfigured()) {
    return {
      ok: false,
      error: 'SMTP is not configured on this deployment. Add SMTP_HOST, SMTP_USER and SMTP_PASS, then try again.',
    };
  }

  const rendered = await renderEmail(key, sampleVarsFor(key));
  const subject = subjectOverride || rendered.subject;
  let html = rendered.html;

  // If the editor has unsaved edits, preview those exactly (not the stored row).
  if (bodyOverride.trim() && bodyOverride.trim() !== '') {
    const { substitute, isFullDocument, wrapEmailShell } = await import('@/lib/email-templates');
    const body = substitute(bodyOverride, { site: 'Language Help BD', ...sampleVarsFor(key) });
    html = isFullDocument(body) ? body : wrapEmailShell(body);
  }

  try {
    await sendMail({
      to,
      subject: `[TEST] ${substitute(subjectOverride || rendered.subject, sampleVarsFor(key))}`,
      html,
      text: rendered.text,
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Sending failed' };
  }

  return { ok: true, message: `Test email sent to ${to}.` };
}

// small local helper so the import above stays tidy
function substitute(input: string, vars: Record<string, string>): string {
  return input.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, name: string) => vars[name] ?? '');
}
