import nodemailer, { type Transporter } from 'nodemailer';

/**
 * SMTP transport (nodemailer).
 *
 * Configure with env vars:
 *   SMTP_HOST      e.g. smtp.gmail.com | smtp-relay.brevo.com | email-smtp.ap-south-1.amazonaws.com
 *   SMTP_PORT      587 (STARTTLS) or 465 (SSL)
 *   SMTP_SECURE    "true" for port 465
 *   SMTP_USER      SMTP username
 *   SMTP_PASS      SMTP password / app password / API key
 *   SMTP_FROM      "Language Help BD <no-reply@languagehelpbd.com>"
 */
export function mailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

let transporter: Transporter | null = null;

function getTransport(): Transporter {
  if (!mailConfigured()) throw new Error('SMTP is not configured');
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 587);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465,
      auth: { user: process.env.SMTP_USER as string, pass: process.env.SMTP_PASS as string },
      // Self-hosted / internal mailers with a self-signed certificate only.
      tls: process.env.SMTP_TLS_INSECURE === '1' ? { rejectUnauthorized: false } : undefined,
      // keep serverless/web hosts from hanging on a bad mailbox
      connectionTimeout: 12_000,
      greetingTimeout: 12_000,
      socketTimeout: 20_000,
    });
  }
  return transporter;
}

const FROM = () =>
  process.env.SMTP_FROM || `Language Help BD <${process.env.SMTP_USER || 'no-reply@languagehelpbd.com'}>`;

function otpTemplate(code: string, name?: string) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:32px 16px;background:#f4f5f7;font-family:Inter,-apple-system,'Segoe UI',Arial,sans-serif;color:#16181c;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;">
      <tr><td style="background:#ffffff;border:1px solid #e3e5ea;border-radius:20px;padding:34px 32px;box-shadow:0 18px 40px -24px rgba(15,23,42,.35);">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:22px;">
          <div style="width:40px;height:40px;border-radius:12px;background:linear-gradient(180deg,#FF525A,#E51A24 52%,#BE121B);color:#fff;font-weight:800;font-size:18px;line-height:40px;text-align:center;">L</div>
          <div>
            <p style="margin:0;font-size:15px;font-weight:800;letter-spacing:-.01em;">Language Help <span style="color:#E51A24;">BD</span></p>
            <p style="margin:2px 0 0;font-size:9px;letter-spacing:2px;color:#9aa1ab;font-weight:700;">LANGUAGE ACADEMY</p>
          </div>
        </div>

        <h1 style="margin:0 0 8px;font-size:21px;letter-spacing:-.02em;">Your sign-in code</h1>
        <p style="margin:0 0 22px;font-size:14px;line-height:1.6;color:#6b7280;">
          ${name ? `Hi ${name}, ` : ''}use the code below to sign in to your Language Help BD account.
        </p>

        <div style="border:1px solid #e3e5ea;border-radius:14px;background:#fbfcfd;padding:18px;text-align:center;box-shadow:inset 0 2px 5px rgba(15,23,42,.06);">
          <p style="margin:0;font-size:34px;font-weight:800;letter-spacing:10px;color:#16181c;">${code}</p>
        </div>

        <p style="margin:20px 0 0;font-size:12.5px;line-height:1.6;color:#8b93a0;">
          This code expires in 10 minutes and can be used once. If you didn’t request it, you can safely ignore this email.
        </p>
      </td></tr>
      <tr><td style="padding:16px 8px 0;text-align:center;font-size:11.5px;color:#9aa1ab;">
        Language Help BD · Dhanmondi, Dhaka · languagehelpbd.com
      </td></tr>
    </table>
  </body>
</html>`;
}

export async function sendOtpEmail(to: string, code: string, name?: string) {
  // The template is editable in Admin → Automated Emails (falls back to the
  // built-in design if the DB/table is unavailable).
  let subject = `${code} is your Language Help BD sign-in code`;
  let html = otpTemplate(code, name);
  let text = `Your Language Help BD sign-in code is ${code}. It expires in 10 minutes.`;
  try {
    const { renderEmail } = await import('@/lib/email-store');
    const rendered = await renderEmail('otp_login', { code, name: name ?? 'there' });
    subject = rendered.subject;
    html = rendered.html;
    text = rendered.text || text;
  } catch {
    // keep the built-in version
  }

  const info = await getTransport().sendMail({ from: FROM(), to, subject, html, text });
  return { messageId: info.messageId };
}

export async function sendMail(opts: { to: string; subject: string; html: string; text?: string }) {
  const info = await getTransport().sendMail({ from: FROM(), ...opts });
  return { messageId: info.messageId };
}

/** Used by the admin “email settings” check. */
export async function verifyMailer() {
  if (!mailConfigured()) return { ok: false, error: 'SMTP is not configured' };
  try {
    await getTransport().verify();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'SMTP verification failed' };
  }
}
