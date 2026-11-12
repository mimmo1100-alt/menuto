import { after, NextResponse } from "next/server";
import { orderEmails } from "@/lib/order-emails";
import { db } from "@/lib/db";
import { expireMissed } from "@/lib/orders";

/** Public order status for the customer's tracking page. The id is an unguessable cuid. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o0 = await db.order.findUnique({ where: { id }, select: { restaurantId: true } });
  if (!o0) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const missed = await expireMissed(o0.restaurantId);
  if (missed.length) after(async () => { for (const id of missed) await orderEmails(id, "missed"); });
  const o = await db.order.findUnique({
    where: { id },
    select: {
      id: true, number: true, status: true, type: true, asap: true, fulfillAt: true, readyAt: true, rejectReason: true,
      payment: true, subtotal: true, discount: true, deliveryFee: true, tax: true, total: true, createdAt: true,
      items: { select: { name: true, sizeName: true, qty: true, options: true, total: true } },
      restaurant: { select: { name: true, slug: true, currency: true, taxIncluded: true, taxName: true } },
    },
  });
  return NextResponse.json(o);
}
