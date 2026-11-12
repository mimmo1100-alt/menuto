import { after, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { canManage } from "@/lib/auth";
import { expireMissed } from "@/lib/orders";
import { orderEmails } from "@/lib/order-emails";

/** Small status call for the Android app's background service: how many orders are ringing, and which accepted orders still need printing. */
export async function GET(_req: Request, { params }: { params: Promise<{ rid: string }> }) {
  const { rid } = await params;
  if (!(await canManage(rid))) return NextResponse.json({ error: "auth" }, { status: 401 });
  const missed = await expireMissed(rid);
  if (missed.length) after(async () => { for (const id of missed) await orderEmails(id, "missed"); });
  const soon = new Date(Date.now() + 4 * 60000);
  const since = new Date(Date.now() - 12 * 3600e3);
  const [ringing, toPrint] = await Promise.all([
    db.order.count({ where: { restaurantId: rid, status: "PENDING", respondBy: { lte: soon } } }),
    db.order.findMany({ where: { restaurantId: rid, status: { in: ["ACCEPTED", "READY"] }, printedAt: null, acceptedAt: { gte: since } }, orderBy: { acceptedAt: "asc" }, select: { id: true, number: true }, take: 10 }),
  ]);
  return NextResponse.json({ ringing, toPrint });
}
