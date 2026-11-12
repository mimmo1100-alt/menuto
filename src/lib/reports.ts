import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { addDaysYmd, dowOfYmd, localParts, zonedToUtc } from "./time";
import { tr } from "./i18n";

/**
 * Sales reports for one restaurant. Days are the restaurant's local days (its time zone), and an order belongs
 * to the day it was placed (createdAt), like the partner panel. "Sold" = accepted, ready or completed.
 * Test orders from the orders screen (email @menuto.invalid) are left out everywhere.
 */
export const SOLD = ["ACCEPTED", "READY", "COMPLETED"] as const;
export const MAX_DAYS = 366;
const NOT_TEST: Prisma.OrderWhereInput = { NOT: { email: { endsWith: "@menuto.invalid" } } };

export type Bucket = { key: string; orders: number; sales: number };
export type SalesReport = {
  from: string; to: string; days: number; currency: string; taxName: string; grain: "day" | "month";
  sold: { orders: number; sales: number; avg: number; items: number; discount: number; deliveryFee: number; tax: number };
  prev: { from: string; to: string; orders: number; sales: number };
  customers: { total: number; returning: number; new: number };
  lost: { missed: Bucket; rejected: Bucket; canceled: Bucket };
  series: Bucket[];
  byPayment: Bucket[];
  byType: Bucket[];
  byHour: Bucket[];
  byWeekday: Bucket[];
  topItems: { key: string; name: Record<string, string>; qty: number; sales: number }[];
};

export const ymdRe = /^\d{4}-\d{2}-\d{2}$/;
export function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 864e5) + 1;
}

/** UTC bounds of local days [from, to] (both inclusive). */
export function rangeUtc(from: string, to: string, tz: string) {
  return { gte: zonedToUtc(from, "00:00", tz), lt: zonedToUtc(addDaysYmd(to, 1), "00:00", tz) };
}

function add(map: Map<string, Bucket>, key: string, total: number) {
  const b = map.get(key) ?? { key, orders: 0, sales: 0 };
  b.orders++; b.sales += total; map.set(key, b);
}
const sorted = (m: Map<string, Bucket>) => [...m.values()].sort((a, b) => b.sales - a.sales || b.orders - a.orders);

export async function salesReport(r: { id: string; timezone: string; currency: string; taxName: string }, from: string, to: string): Promise<SalesReport> {
  const days = daysBetween(from, to);
  if (days < 1 || days > MAX_DAYS) throw new Error("range");
  const tz = r.timezone;
  const pFrom = addDaysYmd(from, -days), pTo = addDaysYmd(from, -1);
  const where = (gte: Date, lt: Date): Prisma.OrderWhereInput => ({ restaurantId: r.id, createdAt: { gte, lt }, ...NOT_TEST });
  const cur = rangeUtc(from, to, tz), prv = rangeUtc(pFrom, pTo, tz);

  const [orders, prev] = await Promise.all([
    db.order.findMany({
      where: where(cur.gte, cur.lt),
      select: {
        status: true, type: true, payment: true, total: true, discount: true, deliveryFee: true, tax: true, email: true, createdAt: true,
        items: { select: { itemId: true, name: true, qty: true, total: true } },
      },
    }),
    db.order.aggregate({ where: { ...where(prv.gte, prv.lt), status: { in: [...SOLD] } }, _count: true, _sum: { total: true } }),
  ]);

  const grain = days > 62 ? "month" : "day";
  const series = new Map<string, Bucket>();
  for (let d = from; d <= to; d = addDaysYmd(d, 1)) {
    const k = grain === "day" ? d : d.slice(0, 7);
    if (!series.has(k)) series.set(k, { key: k, orders: 0, sales: 0 });
  }
  const byPayment = new Map<string, Bucket>(), byType = new Map<string, Bucket>();
  const byHour = new Map<string, Bucket>(Array.from({ length: 24 }, (_, h) => [String(h), { key: String(h), orders: 0, sales: 0 }]));
  const byWeekday = new Map<string, Bucket>(Array.from({ length: 7 }, (_, d) => [String(d), { key: String(d), orders: 0, sales: 0 }]));
  const lost = { MISSED: { key: "MISSED", orders: 0, sales: 0 }, REJECTED: { key: "REJECTED", orders: 0, sales: 0 }, CANCELED: { key: "CANCELED", orders: 0, sales: 0 } };
  const items = new Map<string, { key: string; name: Record<string, string>; qty: number; sales: number }>();
  const sold = { orders: 0, sales: 0, avg: 0, items: 0, discount: 0, deliveryFee: 0, tax: 0 };
  const emails = new Set<string>();

  for (const o of orders) {
    if (o.status in lost) { const b = lost[o.status as keyof typeof lost]; b.orders++; b.sales += o.total; continue; }
    if (!(SOLD as readonly string[]).includes(o.status)) continue;
    const lp = localParts(o.createdAt, tz);
    sold.orders++; sold.sales += o.total; sold.discount += o.discount; sold.deliveryFee += o.deliveryFee; sold.tax += o.tax;
    emails.add(o.email.toLowerCase());
    add(series, grain === "day" ? lp.ymd : lp.ymd.slice(0, 7), o.total);
    add(byPayment, o.payment, o.total);
    add(byType, o.type, o.total);
    add(byHour, String(Math.floor(lp.minutes / 60)), o.total);
    add(byWeekday, String(dowOfYmd(lp.ymd)), o.total);
    for (const it of o.items) {
      const name = (typeof it.name === "object" && it.name ? it.name : { it: String(it.name) }) as Record<string, string>;
      const key = it.itemId ?? `n:${tr(name, "it").toLowerCase()}`;
      const x = items.get(key) ?? { key, name, qty: 0, sales: 0 };
      x.qty += it.qty; x.sales += it.total; items.set(key, x);
      sold.items += it.qty;
    }
  }
  sold.avg = sold.orders ? Math.round(sold.sales / sold.orders) : 0;

  // Returning = ordered (and got the order) at least once before this period.
  let returning = 0;
  if (emails.size) {
    const before = await db.order.findMany({
      where: { restaurantId: r.id, createdAt: { lt: cur.gte }, status: { in: [...SOLD] }, email: { in: [...emails], mode: "insensitive" } },
      select: { email: true }, distinct: ["email"],
    });
    returning = new Set(before.map((b) => b.email.toLowerCase())).size;
  }

  return {
    from, to, days, currency: r.currency, taxName: r.taxName, grain, sold,
    prev: { from: pFrom, to: pTo, orders: prev._count, sales: prev._sum.total ?? 0 },
    customers: { total: emails.size, returning, new: emails.size - returning },
    lost: { missed: lost.MISSED, rejected: lost.REJECTED, canceled: lost.CANCELED },
    series: [...series.values()],
    byPayment: sorted(byPayment), byType: sorted(byType),
    byHour: [...byHour.values()], byWeekday: [...byWeekday.values()],
    topItems: [...items.values()].sort((a, b) => b.qty - a.qty || b.sales - a.sales).slice(0, 15),
  };
}

/** Every order of the period, for the CSV download (test orders excluded). */
export async function reportOrders(r: { id: string; timezone: string }, from: string, to: string) {
  return db.order.findMany({
    where: { restaurantId: r.id, createdAt: rangeUtc(from, to, r.timezone), ...NOT_TEST },
    orderBy: { createdAt: "asc" },
    select: { number: true, createdAt: true, status: true, type: true, payment: true, firstName: true, lastName: true, email: true, phone: true, subtotal: true, discount: true, deliveryFee: true, tax: true, total: true, couponCode: true, rejectReason: true },
  });
}
