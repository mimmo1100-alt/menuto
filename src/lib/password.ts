import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";
import { db } from "./db";
import { sendMail } from "./email";
import { baseUrl, esc } from "./order-emails";

export const MIN_PASSWORD = 8;
const sha = (s: string) => createHash("sha256").update(s).digest("hex");

/** Creates a 1-hour reset link and emails it. Says nothing about whether the email exists. */
export async function requestReset(emailRaw: string) {
  const email = emailRaw.trim().toLowerCase();
  const u = await db.user.findUnique({ where: { email } });
  if (!u) return;
  const token = randomBytes(32).toString("base64url");
  await db.passwordReset.create({ data: { tokenHash: sha(token), userId: u.id, expiresAt: new Date(Date.now() + 3600_000) } });
  const url = `${baseUrl()}/login/reset?token=${token}`;
  const html = `<!doctype html><html lang="it"><body style="margin:0;background:#f5f5ef;font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:#1c2017">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border-radius:12px">
<tr><td style="padding:24px"><h1 style="margin:0 0 10px;font-size:22px">Nuova password</h1>
<p style="margin:0 0 16px">Hai chiesto di cambiare la password di Menuto per <b>${esc(email)}</b>. Il link vale 1 ora.</p>
<a href="${url}" style="display:inline-block;background:#c4381f;color:#fff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:999px">Scegli la nuova password</a>
<p style="margin:16px 0 0;color:#5d6455;font-size:13px">Se non sei stato tu, ignora questa email: la password resta quella di prima.</p>
<p style="margin:12px 0 0;color:#5d6455;font-size:13px">You asked to reset your Menuto password. The link is valid for 1 hour. If it wasn't you, ignore this email.</p>
</td></tr></table></td></tr></table></body></html>`;
  await sendMail({ to: email, subject: "Menuto: nuova password / new password", html, kind: "password_reset" });
}

/** Sets the new password if the token is valid; signs out every other session. Returns the user id or null. */
export async function confirmReset(token: string, password: string) {
  if (password.length < MIN_PASSWORD || password.length > 200) return null;
  const row = await db.passwordReset.findUnique({ where: { tokenHash: sha(token) } });
  if (!row || row.usedAt || row.expiresAt < new Date()) return null;
  const hash = await bcrypt.hash(password, 10);
  await db.$transaction([
    db.user.update({ where: { id: row.userId }, data: { passwordHash: hash } }),
    db.passwordReset.updateMany({ where: { userId: row.userId, usedAt: null }, data: { usedAt: new Date() } }),
    db.session.deleteMany({ where: { userId: row.userId } }),
  ]);
  return row.userId;
}

/** Signed-in change: checks the current password, keeps this session, signs out the others. */
export async function changePassword(userId: string, current: string, next: string, keepSession: string | undefined) {
  if (next.length < MIN_PASSWORD || next.length > 200) return "short";
  const u = await db.user.findUniqueOrThrow({ where: { id: userId } });
  if (!(await bcrypt.compare(current, u.passwordHash))) return "wrong";
  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(next, 10) } }),
    db.session.deleteMany({ where: { userId, ...(keepSession ? { NOT: { id: keepSession } } : {}) } }),
  ]);
  return "ok";
}
