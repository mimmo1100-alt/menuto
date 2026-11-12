import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { confirmReset } from "@/lib/password";
import { clientIp, limitOr429 } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const limited = await limitOr429([[`reset-confirm:${clientIp(req)}`, 20, 3600]]);
  if (limited) return limited;
  const { token, password } = (await req.json().catch(() => ({}))) as { token?: string; password?: string };
  if (!token || !password) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const userId = await confirmReset(token, password);
  if (!userId) return NextResponse.json({ error: password.length < 8 ? "short" : "expired" }, { status: 400 });
  await createSession(userId);
  const u = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { role: true } });
  return NextResponse.json({ ok: true, role: u.role });
}
