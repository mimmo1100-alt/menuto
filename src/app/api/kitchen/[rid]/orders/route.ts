import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { canManage } from "@/lib/auth";
import { expireMissed } from "@/lib/orders";

export async function GET(_req: Request, { params }: { params: Promise<{ rid: string }> }) {
  const { rid } = await params;
  if (!(await canManage(rid))) return NextResponse.json({ error: "auth" }, { status: 401 });
  await expireMissed(rid);
  const since = new Date(Date.now() - 36 * 3600e3);
  const orders = await db.order.findMany({
    where: { restaurantId: rid, OR: [{ createdAt: { gte: since } }, { status: { in: ["PENDING", "ACCEPTED", "READY"] } }] },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { items: true },
  });
  return NextResponse.json({ now: Date.now(), orders });
}
