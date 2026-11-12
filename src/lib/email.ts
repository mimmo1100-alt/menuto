import { db } from "./db";

export type Mail = { to: string; subject: string; html: string; kind: string; orderId?: string; replyTo?: string };

/**
 * Sends through Resend when RESEND_API_KEY is set (EMAIL_FROM = "Menuto <ordini@your-domain>").
 * Without a key, mails are only written to EmailLog, so development and tests never email anyone.
 */
export async function sendMail(m: Mail) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  let status = "logged", error: string | null = null;
  if (key && from) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [m.to], subject: m.subject, html: m.html, reply_to: m.replyTo }),
      });
      status = res.ok ? "sent" : "failed";
      if (!res.ok) error = (await res.text()).slice(0, 500);
    } catch (e) {
      status = "failed"; error = String(e).slice(0, 500);
    }
  }
  await db.emailLog.create({ data: { to: m.to, subject: m.subject, html: m.html, kind: m.kind, orderId: m.orderId, status, error } });
  return status;
}
