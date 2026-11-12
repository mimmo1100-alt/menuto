import { NextResponse } from "next/server";
import { partnerOrders, requirePartner } from "@/lib/partner";

const csvCell = (v: unknown) => { const s = String(v ?? ""); return /[",\n;]/.test(s) || /^[=+\-@]/.test(s) ? `"${s.replace(/^([=+\-@])/, "'$1").replace(/"/g, '""')}"` : s; };

export async function GET(req: Request) {
  const u = await requirePartner();
  if (!u) return NextResponse.json({ error: "auth" }, { status: 401 });
  const q = new URL(req.url).searchParams;
  const orders = await partnerOrders(u.partnerId!, {
    status: q.get("status") || undefined, type: q.get("type") || undefined, restaurantId: q.get("r") || undefined,
    days: Math.min(365, Math.max(1, Number(q.get("days")) || 30)),
  });
  if (q.get("format") === "csv") {
    const rows = [["date", "restaurant", "order", "status", "type", "customer", "payment", "total"],
      ...orders.map((o) => [o.createdAt.toISOString(), o.restaurant.name, o.number, o.status, o.type, `${o.firstName} ${o.lastName}`, o.payment, (o.total / 100).toFixed(2)])];
    const body = "﻿" + rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
    return new NextResponse(body, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="menuto-orders.csv"` } });
  }
  return NextResponse.json(orders);
}
