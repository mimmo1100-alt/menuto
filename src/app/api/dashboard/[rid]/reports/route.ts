import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { canManage } from "@/lib/auth";
import { daysBetween, MAX_DAYS, reportOrders, salesReport, ymdRe } from "@/lib/reports";

// Cells that Excel would run as a formula get a leading quote; phone numbers like "+39 333…" are left alone.
const risky = (s: string) => /^[=@\t\r]/.test(s) || /^[+-](?![\d\s().]*$)/.test(s);
const csvCell = (v: unknown) => { let s = String(v ?? ""); if (risky(s)) s = `'${s}`; return /[",\n;']/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const eur = (c: number) => (c / 100).toFixed(2);

/** GET ?from=YYYY-MM-DD&to=YYYY-MM-DD[&format=csv] — sales report of one restaurant (owners and partners, not staff). */
export async function GET(req: Request, { params }: { params: Promise<{ rid: string }> }) {
  const { rid } = await params;
  const user = await canManage(rid);
  if (!user || user.role === "STAFF") return NextResponse.json({ error: "auth" }, { status: 401 });
  const q = new URL(req.url).searchParams;
  const from = q.get("from") ?? "", to = q.get("to") ?? "";
  if (!ymdRe.test(from) || !ymdRe.test(to) || daysBetween(from, to) < 1 || daysBetween(from, to) > MAX_DAYS) {
    return NextResponse.json({ error: "range" }, { status: 400 });
  }
  const r = await db.restaurant.findUniqueOrThrow({ where: { id: rid }, select: { id: true, slug: true, timezone: true, currency: true, taxName: true } });

  if (q.get("format") === "csv") {
    const orders = await reportOrders(r, from, to);
    const fmt = new Intl.DateTimeFormat("sv-SE", { timeZone: r.timezone, dateStyle: "short", timeStyle: "short" });
    const rows = [["date", "order", "status", "type", "payment", "first_name", "last_name", "email", "phone", "subtotal", "discount", "delivery_fee", "tax", "total", "coupon", "reason"],
      ...orders.map((o) => [fmt.format(o.createdAt), o.number, o.status, o.type, o.payment, o.firstName, o.lastName, o.email, o.phone, eur(o.subtotal), eur(o.discount), eur(o.deliveryFee), eur(o.tax), eur(o.total), o.couponCode, o.rejectReason])];
    const body = "﻿" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
    return new NextResponse(body, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="menuto-${r.slug}-${from}_${to}.csv"` } });
  }
  return NextResponse.json(await salesReport(r, from, to));
}
