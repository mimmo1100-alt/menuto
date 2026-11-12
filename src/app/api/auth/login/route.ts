import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { clientIp, limitOr429 } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const { email, password } = (await req.json().catch(() => ({}))) as { email?: string; password?: string };
  if (!email || !password) return NextResponse.json({ error: "invalid" }, { status: 400 });
  // slow down password guessing: per IP and per account
  const limited = await limitOr429([[`login-ip:${clientIp(req)}`, 30, 900], [`login-email:${email.trim().toLowerCase()}`, 10, 900]]);
  if (limited) return limited;
  const u = await db.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!u || !(await bcrypt.compare(password, u.passwordHash))) return NextResponse.json({ error: "credentials" }, { status: 401 });
  await createSession(u.id);
  return NextResponse.json({ ok: true, role: u.role });
}
