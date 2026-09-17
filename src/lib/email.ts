import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

let transporterPromise: Promise<Transporter> | null = null;

async function getTransporter(): Promise<Transporter> {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  // No SMTP configured: use Ethereal test account (inbox viewable) once.
  const testAccount = await nodemailer.createTestAccount();
  console.log(
    `[email] Using Ethereal test account: ${testAccount.user} / pass ${testAccount.pass}`
  );
  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
}

async function ensureTransporter(): Promise<Transporter> {
  if (!transporterPromise) transporterPromise = getTransporter();
  return transporterPromise;
}

export type AppEmail = { to: string; subject: string; html: string };

export async function sendEmail({ to, subject, html }: AppEmail) {
  try {
    const transporter = await ensureTransporter();
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || "SkillSpot <no-reply@skillspot.local>",
      to,
      subject,
      html,
    });
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(
      `[email] sent to=${to} subject="${subject}" messageId=${info.messageId}` +
        (previewUrl ? ` preview=${previewUrl}` : "")
    );
    return { ok: true, previewUrl: previewUrl ?? null };
  } catch (err) {
    // Email must never crash the app flow — log full content as fallback.
    console.error(`[email] FAILED to=${to} subject="${subject}"`, err);
    console.log(`[email-fallback-body] ${html}`);
    return { ok: false, previewUrl: null };
  }
}

const shell = (title: string, body: string) => `
<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
  <div style="background:#4f46e5;color:#fff;padding:16px 24px;font-size:18px;font-weight:700">SkillSpot</div>
  <div style="padding:24px;color:#111827">
    <h2 style="margin:0 0 12px;font-size:18px">${title}</h2>
    ${body}
  </div>
  <div style="padding:12px 24px;background:#f9fafb;color:#6b7280;font-size:12px">
    SkillSpot — find the best kids' & adults' activities in Warsaw. This is an automated message.
  </div>
</div>`;

export function newRequestEmail(opts: {
  providerName: string;
  requesterName: string;
  requesterEmail: string;
  requesterPhone?: string | null;
  serviceTitle?: string | null;
  message: string;
  dashboardUrl: string;
}) {
  return {
    subject: `New booking request for ${opts.providerName}`,
    html: shell(
      `New request for ${opts.providerName}`,
      `<p><strong>${opts.requesterName}</strong> wants to join ${
        opts.serviceTitle ? `<strong>${opts.serviceTitle}</strong>` : "your classes"
      }.</p>
       <blockquote style="border-left:3px solid #4f46e5;padding-left:12px;color:#374151">${opts.message
         .replace(/</g, "&lt;")
         .replace(/\n/g, "<br/>")}</blockquote>
       <p>Reply to: <a href="mailto:${opts.requesterEmail}">${opts.requesterEmail}</a>${
         opts.requesterPhone ? ` · ☎ ${opts.requesterPhone}` : ""
       }</p>
       <p><a href="${opts.dashboardUrl}" style="background:#4f46e5;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Open dashboard</a></p>`
    ),
  };
}
