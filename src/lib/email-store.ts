import { db } from '@/db';
import { emailTemplates } from '@/db/schema';
import { eq } from 'drizzle-orm';
import {
  EMAIL_BY_KEY,
  EMAIL_TEMPLATES,
  htmlToText,
  isFullDocument,
  substitute,
  wrapEmailShell,
  type EmailKey,
} from '@/lib/email-templates';

export type StoredTemplate = {
  key: string;
  name: string;
  when: string;
  variables: string[];
  subject: string;
  bodyHtml: string;
  enabled: boolean;
  custom: boolean;
  updatedAt: string | null;
};

function defaultsFor(key: EmailKey): StoredTemplate {
  const def = EMAIL_BY_KEY[key];
  return {
    key,
    name: def.name,
    when: def.when,
    variables: def.variables,
    subject: def.defaultSubject,
    bodyHtml: def.defaultBody,
    enabled: true,
    custom: false,
    updatedAt: null,
  };
}

/**
 * Every template the admin can edit, database rows merged over the defaults.
 * If the table does not exist yet (fresh install) this still returns the
 * defaults instead of throwing — the editor stays usable and the health check
 * reports the missing table.
 */
export async function listEmailTemplates(): Promise<StoredTemplate[]> {
  let rows: Awaited<ReturnType<typeof selectRows>> = [];
  try {
    rows = await selectRows();
  } catch {
    rows = [];
  }
  const byKey = new Map(rows.map((row) => [row.key, row]));

  return EMAIL_TEMPLATES.map((def) => {
    const row = byKey.get(def.key);
    if (!row) return defaultsFor(def.key);
    return {
      key: def.key,
      name: def.name,
      when: def.when,
      variables: def.variables,
      subject: row.subject || def.defaultSubject,
      bodyHtml: row.bodyHtml || def.defaultBody,
      enabled: row.enabled,
      custom: true,
      updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : null,
    };
  });
}

function selectRows() {
  return db.select().from(emailTemplates);
}

export async function getStoredTemplate(key: string): Promise<StoredTemplate> {
  const all = await listEmailTemplates();
  const found = all.find((t) => t.key === key);
  if (found) return found;
  return defaultsFor(key as EmailKey);
}

export type RenderedEmail = { subject: string; html: string; text: string; enabled: boolean };

/**
 * Render a template with variables. Falls back to the built-in default if the
 * database is unreachable, so transactional mail never breaks because of a
 * missing table.
 */
export async function renderEmail(
  key: EmailKey | string,
  vars: Record<string, string>,
): Promise<RenderedEmail> {
  const def = EMAIL_BY_KEY[key];
  let subject = def?.defaultSubject ?? key;
  let body = def?.defaultBody ?? '';
  let enabled = true;

  try {
    const rows = await db.select().from(emailTemplates).where(eq(emailTemplates.key, key)).limit(1);
    const row = rows[0];
    if (row) {
      if (row.subject) subject = row.subject;
      if (row.bodyHtml) body = row.bodyHtml;
      enabled = row.enabled;
    }
  } catch {
    // keep defaults
  }

  const mergedVars = { site: 'Language Help BD', ...vars };
  const finalSubject = substitute(subject, mergedVars);
  const finalBody = substitute(body, mergedVars);
  const html = isFullDocument(finalBody) ? finalBody : wrapEmailShell(finalBody);

  return { subject: finalSubject, html, text: htmlToText(finalBody), enabled };
}
