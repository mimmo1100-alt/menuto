import { NextResponse } from "next/server";
import { currentSessionId, currentUser } from "@/lib/auth";
import { changePassword } from "@/lib/password";
import { limitOr429 } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: "auth" }, { status: 401 });
  const limited = await limitOr429([[`pw-change:${u.id}`, 10, 3600]]);
  if (limited) return limited;
  const { current, next } = (await req.json().catch(() => ({}))) as { current?: string; next?: string };
  if (!current || !next) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const r = await changePassword(u.id, current, next, await currentSessionId());
  return r === "ok" ? NextResponse.json({ ok: true }) : NextResponse.json({ error: r }, { status: 400 });
}
