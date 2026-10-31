/**
 * Automated email templates — shared registry (safe for client and server).
 *
 * The admin UI edits these in the database (`email_templates` table). Anything
 * not customised falls back to the defaults below, so the app always has a
 * working email even before anyone touches the editor.
 *
 * Placeholders use {{double_braces}} and are substituted at send time.
 */

export type EmailKey =
  | 'otp_login'
  | 'enrollment_received'
  | 'enrollment_verified'
  | 'enrollment_confirmed'
  | 'payment_received'
  | 'certificate_ready'
  | 'book_order'
  | 'contact_reply';

export type EmailTemplateDef = {
  key: EmailKey;
  name: string;
  when: string;
  variables: string[];
  defaultSubject: string;
  defaultBody: string;
  sample: Record<string, string>;
};

const SITE = 'Language Help BD';

/** Consistent paragraph/heading styles used inside emails (inline = email-safe). */
const H1 = 'margin:0 0 8px;font-size:21px;letter-spacing:-.02em;color:#16181c;';
const P = 'margin:0 0 16px;font-size:14px;line-height:1.65;color:#4b5563;';
const SMALL = 'margin:20px 0 0;font-size:12.5px;line-height:1.6;color:#8b93a0;';
const BOX = 'border:1px solid #e3e5ea;border-radius:14px;background:#fbfcfd;padding:18px;text-align:center;';
const BTN =
  'display:inline-block;background:#E51A24;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 22px;border-radius:10px;';

export const EMAIL_TEMPLATES: EmailTemplateDef[] = [
  {
    key: 'otp_login',
    name: 'Sign-in code (OTP)',
    when: 'Sent every time someone chooses “Email code” on the login page.',
    variables: ['name', 'code', 'site'],
    defaultSubject: '{{code}} is your {{site}} sign-in code',
    defaultBody: `<h1 style="${H1}">Your sign-in code</h1>
<p style="${P}">Hi {{name}}, use the code below to sign in to your {{site}} account.</p>
<div style="${BOX}"><p style="margin:0;font-size:34px;font-weight:800;letter-spacing:10px;color:#16181c;">{{code}}</p></div>
<p style="${SMALL}">This code expires in 10 minutes and can be used once. If you didn’t request it, you can safely ignore this email.</p>`,
    sample: { name: 'Nusrat', code: '482913', site: SITE },
  },
  {
    key: 'enrollment_received',
    name: 'Enrollment request received',
    when: 'Sent when a student submits an enrollment request.',
    variables: ['name', 'course', 'site', 'link'],
    defaultSubject: 'We received your enrollment for {{course}}',
    defaultBody: `<h1 style="${H1}">Request received</h1>
<p style="${P}">Hi {{name}}, thank you for choosing {{site}}. We have received your enrollment request for <strong>{{course}}</strong> and our management team is reviewing it now.</p>
<p style="${P}">We will contact you shortly to confirm your seat.</p>
<p style="margin:22px 0 0;"><a href="{{link}}" style="${BTN}">Track it in your portal</a></p>`,
    sample: { name: 'Nusrat', course: 'IELTS Preparation', site: SITE, link: 'https://languagehelpbd.com/portal' },
  },
  {
    key: 'enrollment_verified',
    name: 'Enrollment verified',
    when: 'Sent after management verifies an enrollment (payment instructions).',
    variables: ['name', 'course', 'due', 'site'],
    defaultSubject: 'Your {{course}} enrollment is verified',
    defaultBody: `<h1 style="${H1}">Your enrollment is verified</h1>
<p style="${P}">Hi {{name}}, your enrollment for <strong>{{course}}</strong> has been verified by the management.</p>
<p style="${P}">Please come to the office to pay your first installment. Total payable: <strong>{{due}}</strong> (course fee + book).</p>
<p style="${SMALL}">Bring your student ID or this email with you.</p>`,
    sample: { name: 'Nusrat', course: 'IELTS Preparation', due: '৳7,500', site: SITE },
  },
  {
    key: 'enrollment_confirmed',
    name: 'Enrollment confirmed',
    when: 'Sent when a seat is confirmed and the course appears in the portal.',
    variables: ['name', 'course', 'batch', 'start', 'site', 'link'],
    defaultSubject: 'Welcome aboard — {{course}} confirmed',
    defaultBody: `<h1 style="${H1}">Your seat is confirmed 🎉</h1>
<p style="${P}">Congratulations {{name}}! You are enrolled in <strong>{{course}}</strong>{{batch}}.</p>
<p style="${P}">Classes start on <strong>{{start}}</strong>. Your course, routine and attendance are now available in your portal.</p>
<p style="margin:22px 0 0;"><a href="{{link}}" style="${BTN}">Open my portal</a></p>`,
    sample: { name: 'Nusrat', course: 'IELTS Preparation', batch: ' (Batch 12)', start: 'Sunday, 5 Jan', site: SITE, link: 'https://languagehelpbd.com/portal' },
  },
  {
    key: 'payment_received',
    name: 'Payment receipt',
    when: 'Sent when a payment is recorded against a student.',
    variables: ['name', 'amount', 'course', 'outstanding', 'site'],
    defaultSubject: 'Payment received — {{amount}}',
    defaultBody: `<h1 style="${H1}">Payment received</h1>
<p style="${P}">Hi {{name}}, we have received your payment of <strong>{{amount}}</strong> for {{course}}.</p>
<div style="${BOX}"><p style="margin:0;font-size:13px;color:#6b7280;">Remaining balance</p><p style="margin:6px 0 0;font-size:26px;font-weight:800;color:#16181c;">{{outstanding}}</p></div>
<p style="${SMALL}">You can view your full payment history in your portal.</p>`,
    sample: { name: 'Nusrat', amount: '৳3,000', course: 'IELTS Preparation', outstanding: '৳4,500', site: SITE },
  },
  {
    key: 'certificate_ready',
    name: 'Certificate ready',
    when: 'Sent when a student completes every class of a course.',
    variables: ['name', 'course', 'site', 'link'],
    defaultSubject: 'Your {{course}} certificate is ready 🎓',
    defaultBody: `<h1 style="${H1}">Certificate ready 🎓</h1>
<p style="${P}">Congratulations {{name}}! You have completed every class of <strong>{{course}}</strong>.</p>
<p style="${P}">Your Certificate of Completion is now available in your portal — you can view and print it anytime.</p>
<p style="margin:22px 0 0;"><a href="{{link}}" style="${BTN}">View my certificate</a></p>`,
    sample: { name: 'Nusrat', course: 'IELTS Preparation', site: SITE, link: 'https://languagehelpbd.com/portal/certificates' },
  },
  {
    key: 'book_order',
    name: 'Book order received',
    when: 'Sent when someone orders a book from the store.',
    variables: ['name', 'book', 'variant', 'amount', 'site'],
    defaultSubject: 'Book order received — {{book}}',
    defaultBody: `<h1 style="${H1}">Book order received</h1>
<p style="${P}">Hi {{name}}, your order for <strong>{{book}}</strong> ({{variant}}) totalling <strong>{{amount}}</strong> has been received.</p>
<p style="${P}">Our management will contact you to arrange collection or delivery.</p>`,
    sample: { name: 'Nusrat', book: 'IELTS Vocabulary Builder', variant: 'Paperback', amount: '৳450', site: SITE },
  },
  {
    key: 'contact_reply',
    name: 'Contact form auto-reply',
    when: 'Sent automatically to anyone who uses the website contact form.',
    variables: ['name', 'site'],
    defaultSubject: 'We received your message — {{site}}',
    defaultBody: `<h1 style="${H1}">Thanks for getting in touch</h1>
<p style="${P}">Hi {{name}}, we have received your message and our team will reply within one working day.</p>
<p style="${P}">If it is urgent, call the office or message us on WhatsApp.</p>
<p style="${SMALL}">This is an automated confirmation — you do not need to reply to it.</p>`,
    sample: { name: 'Nusrat', site: SITE },
  },
];

export const EMAIL_BY_KEY: Record<string, EmailTemplateDef> = Object.fromEntries(
  EMAIL_TEMPLATES.map((t) => [t.key, t]),
);

/** {{placeholder}} → value, with unknown/empty placeholders removed. */
export function substitute(input: string, vars: Record<string, string>): string {
  return input.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, name: string) => {
    const value = vars[name];
    return value === undefined || value === null ? '' : String(value);
  });
}

/** True when the admin pasted a complete HTML document (we then don't wrap it). */
export function isFullDocument(html: string): boolean {
  return /<!doctype|<html[\s>]/i.test(html.trim().slice(0, 400));
}

/** The branded wrapper: header lock-up, white card, quiet footer. */
export function wrapEmailShell(bodyHtml: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${SITE}</title>
  </head>
  <body style="margin:0;padding:32px 16px;background:#f4f5f7;font-family:Inter,-apple-system,'Segoe UI',Arial,sans-serif;color:#16181c;-webkit-font-smoothing:antialiased;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;border-collapse:separate;">
      <tr>
        <td style="background:#ffffff;border:1px solid #e3e5ea;border-radius:20px;padding:34px 32px;box-shadow:0 18px 40px -24px rgba(15,23,42,.35);">
          <div style="margin-bottom:22px;">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr>
              <td style="width:40px;height:40px;border-radius:12px;background:#E51A24;color:#ffffff;font-weight:800;font-size:18px;line-height:40px;text-align:center;">L</td>
              <td style="padding-left:10px;vertical-align:middle;">
                <p style="margin:0;font-size:15px;font-weight:800;letter-spacing:-.01em;color:#16181c;">Language Help <span style="color:#E51A24;">BD</span></p>
                <p style="margin:2px 0 0;font-size:9px;letter-spacing:2px;color:#9aa1ab;font-weight:700;">LANGUAGE ACADEMY</p>
              </td>
            </tr></table>
          </div>
          ${bodyHtml}
        </td>
      </tr>
      <tr>
        <td style="padding:16px 8px 0;text-align:center;font-size:11.5px;color:#9aa1ab;line-height:1.6;">
          ${SITE} · Dhanmondi, Dhaka · languagehelpbd.com
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/** Plain-text alternative (better deliverability + accessibility). */
export function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h1|h2|h3|tr|li)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Used by the preview and by “send test email”. */
export function sampleVarsFor(key: string): Record<string, string> {
  return EMAIL_BY_KEY[key]?.sample ?? { name: 'Nusrat', site: SITE };
}
