import nodemailer from 'nodemailer';
import { env } from '../config/env';

// ─── Transporter (lazy-initialised) ──────────────────────────────────────────

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });
  }
  return transporter;
}

// ─── Generic send ─────────────────────────────────────────────────────────────

interface MailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

async function sendMail(opts: MailOptions): Promise<void> {
  if (!env.SMTP_USER || !env.SMTP_PASS) {
    process.stdout.write(`[Email] SMTP not configured — skipping email to ${opts.to}\n`);
    return;
  }
  await getTransporter().sendMail({
    from: `"University ERP" <${env.FROM_EMAIL}>`,
    ...opts,
  });
}

// ─── Welcome email ────────────────────────────────────────────────────────────

export async function sendWelcomeEmail(
  email: string,
  name: string,
  password: string,
  role: string
): Promise<void> {
  const subject = '[University ERP] Your account has been created';
  const roleLabel = role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const html = `
    <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:24px">
      <h2 style="color:#111827">Welcome to University ERP</h2>
      <p style="color:#374151">Hello <strong>${name}</strong>,</p>
      <p style="color:#374151">
        Your account has been created with the role of <strong>${roleLabel}</strong>.
        Use the credentials below to log in.
      </p>
      <table style="border:1px solid #e5e7eb;border-radius:8px;padding:16px;background:#f9fafb;width:100%">
        <tr><td style="color:#6b7280;padding:4px 0">Email</td><td style="color:#111827"><strong>${email}</strong></td></tr>
        <tr><td style="color:#6b7280;padding:4px 0">Password</td><td style="color:#111827"><strong>${password}</strong></td></tr>
      </table>
      <p style="color:#ef4444;font-size:13px;margin-top:16px">
        Please change your password immediately after your first login.
      </p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
      <p style="color:#9ca3af;font-size:12px">
        This email was sent by University ERP. If you did not expect this, contact your administrator.<br/>
        <a href="#" style="color:#9ca3af">Unsubscribe</a>
      </p>
    </div>
  `;

  const text = `Welcome to University ERP\n\nHello ${name},\nYour account has been created.\nEmail: ${email}\nPassword: ${password}\nRole: ${roleLabel}\n\nPlease change your password after first login.`;

  await sendMail({ to: email, subject, html, text });
}

// ─── Attendance warning email ─────────────────────────────────────────────────

export async function sendAttendanceWarningEmail(
  email: string,
  name: string,
  subjectName: string,
  percentage: number
): Promise<void> {
  const subject = `[University ERP] Attendance Warning — ${subjectName} (${percentage}%)`;
  const html = `
    <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:24px">
      <h2 style="color:#ef4444">Attendance Warning</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>Your attendance in <strong>${subjectName}</strong> has dropped to <strong>${percentage}%</strong>, which is below the required 75%.</p>
      <p>Please ensure regular attendance to remain eligible for exams.</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
      <p style="color:#9ca3af;font-size:12px"><a href="#">Unsubscribe</a></p>
    </div>
  `;
  const text = `Attendance Warning\n\nHello ${name},\nYour attendance in ${subjectName} is ${percentage}% — below the required 75%.`;
  await sendMail({ to: email, subject, html, text });
}
