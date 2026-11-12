import { after, NextResponse } from "next/server";
import { orderEmails, type EmailKind } from "@/lib/order-emails";
import { z } from "zod";
import { db } from "@/lib/db";
import { canManage } from "@/lib/auth";

const body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("accept"), prepMin: z.number().int().min(1).max(600) }),
  z.object({ action: z.literal("reject"), reason: z.string().max(40) }),
  z.object({ action: z.literal("cancel"), reason: z.string().max(40) }),
  z.object({ action: z.literal("ready") }),
  z.object({ action: z.literal("complete") }),
]);

export async function POST(req: Request, { params }: { params: Promise<{ rid: string; id: string }> }) {
  const { rid, id } = await params;
  if (!(await canManage(rid))) return NextResponse.json({ error: "auth" }, { status: 401 });
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const o = await db.order.findFirst({ where: { id, restaurantId: rid } });
  if (!o) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const a = parsed.data;
  const now = new Date();
  const allowed: Record<string, string[]> = {
    accept: ["PENDING", "MISSED"], reject: ["PENDING", "MISSED"], cancel: ["ACCEPTED", "READY"], ready: ["ACCEPTED"], complete: ["ACCEPTED", "READY"],
  };
  if (!allowed[a.action].includes(o.status)) return NextResponse.json({ error: "state", status: o.status }, { status: 409 });
  const data =
    a.action === "accept" ? { status: "ACCEPTED" as const, prepMin: a.prepMin, acceptedAt: now, readyAt: new Date(Math.max(now.getTime() + a.prepMin * 60000, o.fulfillAt?.getTime() ?? 0)) }
    : a.action === "reject" ? { status: "REJECTED" as const, rejectReason: a.reason }
    : a.action === "cancel" ? { status: "CANCELED" as const, rejectReason: a.reason }
    : a.action === "ready" ? { status: "READY" as const }
    : { status: "COMPLETED" as const };
  // guard against two devices answering at once
  const res = await db.order.updateMany({ where: { id, status: o.status }, data });
  if (res.count === 0) return NextResponse.json({ error: "state" }, { status: 409 });
  const mail: Partial<Record<string, EmailKind>> = { accept: "accepted", reject: "rejected", cancel: "canceled", ready: "ready" };
  const kind = mail[a.action];
  if (kind) after(() => orderEmails(id, kind));
  return NextResponse.json({ ok: true });
}
