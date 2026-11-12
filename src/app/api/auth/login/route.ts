import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { clientIp, isLimited, rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const { email, password } = (await req.json().catch(() => ({}))) as { email?: string; password?: string };
  if (!email || !password) return NextResponse.json({ error: "invalid" }, { status: 400 });
  // slow down password guessing: only failed attempts count, per IP and per account, 15 minutes
  const keys: [string, number][] = [[`login-fail-ip:${clientIp(req)}`, 30], [`login-fail:${email.trim().toLowerCase()}`, 10]];
  for (const [key, limit] of keys) {
    if (await isLimited(key, limit, 900)) return NextResponse.json({ error: "too_many" }, { status: 429, headers: { "retry-after": "900" } });
  }
  const u = await db.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!u || !(await bcrypt.compare(password, u.passwordHash))) {
    for (const [key, limit] of keys) await rateLimit(key, limit, 900);
    return NextResponse.json({ error: "credentials" }, { status: 401 });
  }
  await createSession(u.id);
  return NextResponse.json({ ok: true, role: u.role });
}
