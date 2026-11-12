import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { canManage } from "@/lib/auth";

export async function POST(_req: Request, { params }: { params: Promise<{ rid: string; id: string }> }) {
  const { rid, id } = await params;
  if (!(await canManage(rid))) return NextResponse.json({ error: "auth" }, { status: 401 });
  await db.order.updateMany({ where: { id, restaurantId: rid }, data: { printedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
