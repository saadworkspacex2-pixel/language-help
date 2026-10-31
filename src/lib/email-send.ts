import { renderEmail } from '@/lib/email-store';
import { mailConfigured, sendMail } from '@/lib/mailer';
import type { EmailKey } from '@/lib/email-templates';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export type SendResult = { sent: boolean; reason?: string };

/**
 * Fire-and-forget transactional email built from an admin-editable template.
 *
 * Never throws: a missing SMTP setup, a disabled template, an unknown address
 * or a provider hiccup must not break the user-facing action that triggered it
 * (submitting a form, placing an order, …).
 */
export async function sendTemplateEmail(
  key: EmailKey,
  to: string | null | undefined,
  vars: Record<string, string>,
): Promise<SendResult> {
  const address = (to ?? '').trim();
  if (!address || !EMAIL_RE.test(address)) return { sent: false, reason: 'no valid recipient email' };
  if (!mailConfigured()) return { sent: false, reason: 'SMTP not configured' };

  try {
    const rendered = await renderEmail(key, { ...vars, link: vars.link ?? '' });
    if (!rendered.enabled) return { sent: false, reason: 'template switched off by admin' };
    await sendMail({ to: address, subject: rendered.subject, html: rendered.html, text: rendered.text });
    return { sent: true };
  } catch (err) {
    console.error(`[email:${key}]`, err instanceof Error ? err.message : err);
    return { sent: false, reason: err instanceof Error ? err.message : 'send failed' };
  }
}
