import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { canManage } from "@/lib/auth";
import { RESPOND_MINUTES } from "@/lib/orders";

/** Creates a fake order so staff can check the sound and the printer. It is never emailed. */
export async function POST(_req: Request, { params }: { params: Promise<{ rid: string }> }) {
  const { rid } = await params;
  if (!(await canManage(rid))) return NextResponse.json({ error: "auth" }, { status: 401 });
  const item = await db.item.findFirst({ where: { restaurantId: rid }, orderBy: { position: "asc" }, include: { sizes: { orderBy: { position: "asc" }, take: 1 } } });
  const price = item ? item.sizes[0]?.price ?? item.price : 1000;
  const last = await db.order.findFirst({ where: { restaurantId: rid }, orderBy: { number: "desc" }, select: { number: true } });
  const o = await db.order.create({
    data: {
      restaurantId: rid, number: (last?.number ?? 0) + 1, type: "PICKUP", status: "PENDING", asap: true,
      firstName: "TEST", lastName: "Menuto", email: "test@menuto.invalid", phone: "+39 000 000 0000", payment: "cash",
      comments: "Ordine di prova / Test order", subtotal: price * 2, total: price * 2,
      respondBy: new Date(Date.now() + RESPOND_MINUTES * 60000),
      items: { create: [{ itemId: item?.id, name: (item?.name as object) ?? { it: "Prodotto di prova" }, sizeName: (item?.sizes[0]?.name as object) ?? undefined, qty: 2, unitPrice: price, options: [], total: price * 2 }] },
    },
  });
  return NextResponse.json({ id: o.id });
}
