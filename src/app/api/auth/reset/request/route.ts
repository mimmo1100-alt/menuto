import { NextResponse } from "next/server";
import { requestReset } from "@/lib/password";
import { clientIp, limitOr429 } from "@/lib/rate-limit";

/** Always answers ok (never reveals whether an email has an account). */
export async function POST(req: Request) {
  const { email } = (await req.json().catch(() => ({}))) as { email?: string };
  if (!email || email.length > 200) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const ip = clientIp(req);
  const limited = await limitOr429([[`reset-ip:${ip}`, 10, 3600], [`reset-email:${email.trim().toLowerCase()}`, 3, 3600]]);
  if (limited) return limited;
  await requestReset(email);
  return NextResponse.json({ ok: true });
}
