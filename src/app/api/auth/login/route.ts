import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function POST(req: Request) {
  const { email, password } = (await req.json().catch(() => ({}))) as { email?: string; password?: string };
  if (!email || !password) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const u = await db.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!u || !(await bcrypt.compare(password, u.passwordHash))) return NextResponse.json({ error: "credentials" }, { status: 401 });
  await createSession(u.id);
  return NextResponse.json({ ok: true, role: u.role });
}
