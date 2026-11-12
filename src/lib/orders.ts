import { z } from "zod";
import type { ServiceType } from "@prisma/client";
import { db } from "./db";
import { loadRestaurant, publicMenu, type FullRestaurant } from "./menu";
import { computeTotals, couponUsable, findItem, OrderError, priceLine, type PricedLine } from "./pricing";
import { nextOpening, validateWhen } from "./availability";
import { zoneFor } from "./geo";

export const RESPOND_MINUTES = 4;

const lineSchema = z.object({
  itemId: z.string().min(1), sizeId: z.string().nullish(), optionIds: z.array(z.string()).max(60),
  qty: z.number().int().min(1).max(99), instructions: z.string().max(200).optional(),
});
export const orderSchema = z.object({
  lines: z.array(lineSchema).min(1).max(80),
  type: z.enum(["PICKUP", "DELIVERY", "DINEIN"]),
  when: z.union([z.object({ asap: z.literal(true) }), z.object({ asap: z.literal(false), ymd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), time: z.string().regex(/^\d{2}:\d{2}$/) })]),
  customer: z.object({
    // at the table only the first name is needed; the other fields are checked in createOrder for pickup/delivery
    firstName: z.string().trim().min(1).max(60), lastName: z.string().trim().max(60).default(""),
    email: z.string().trim().max(120).default(""), phone: z.string().trim().max(30).default(""), marketingOk: z.boolean().optional(),
  }),
  address: z.object({ street: z.string().trim().min(2).max(120), city: z.string().trim().min(1).max(80), more: z.string().trim().max(160).optional() }).nullish(),
  location: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }).nullish(),
  /// code from the table QR; required for DINEIN, the table name is taken from the database
  tableCode: z.string().trim().max(40).nullish(),
  payment: z.string().min(1).max(30),
  comments: z.string().trim().max(500).optional(),
  coupon: z.string().trim().max(40).optional(),
  lang: z.enum(["it", "en", "ar"]).default("it"),
});
export type OrderInput = z.infer<typeof orderSchema>;
export const quoteSchema = orderSchema.pick({ lines: true, type: true, location: true, coupon: true });

export async function quote(r: FullRestaurant, input: z.infer<typeof quoteSchema>) {
  const menu = publicMenu(r);
  const lines: PricedLine[] = input.lines.map((l) => {
    const item = findItem(menu, l.itemId);
    if (!item) throw new OrderError("item");
    return priceLine(item, l);
  });
  const isDelivery = input.type === "DELIVERY";
  // delivery area comes from the customer's pin; outside every area is refused unless the restaurant allows it
  const loc = input.location;
  const zone = isDelivery && loc ? zoneFor(r.zones, loc.lat, loc.lng) : null;
  if (isDelivery && r.zones.length && !zone && !(loc && r.allowOutsideZones)) throw new OrderError("zone");
  let coupon = null;
  if (input.coupon) {
    const c = await db.coupon.findUnique({ where: { restaurantId_code: { restaurantId: r.id, code: input.coupon.toUpperCase() } } });
    if (!couponUsable(c)) throw new OrderError("coupon");
    coupon = c;
  }
  return { lines, zone, totals: computeTotals(r, lines, { zone, coupon, isDelivery }) };
}

export async function createOrder(slug: string, raw: unknown) {
  const input = orderSchema.parse(raw);
  const r = await loadRestaurant(slug);
  if (!r) throw new OrderError("invalid");
  const service = input.type as ServiceType;
  const fulfillAt = validateWhen(r, service, input.when);
  const allowed = ((r.payments as Record<string, string[]>)[service] ?? []);
  if (!allowed.includes(input.payment)) throw new OrderError("invalid");
  if (service === "DELIVERY" && !input.address) throw new OrderError("invalid");
  const c = input.customer;
  if (service !== "DINEIN" && (!c.lastName || !/^\S+@\S+\.\S+$/.test(c.email) || c.phone.replace(/\D/g, "").length < 6)) throw new OrderError("invalid");
  if (c.email && !/^\S+@\S+\.\S+$/.test(c.email)) throw new OrderError("invalid");
  const table = service === "DINEIN" ? await findTable(r.id, input.tableCode) : null;
  if (service === "DINEIN" && !table) throw new OrderError("table");
  const { lines, zone, totals } = await quote(r, input);

  const now = new Date();
  const auto = r.autoAccept;
  const opensAt = nextOpening(r, service, now) ?? now;
  const respondBy = new Date(Math.max(now.getTime(), opensAt.getTime()) + RESPOND_MINUTES * 60000);
  const prepMin = auto ? (service === "DELIVERY" ? zone?.prepMin ?? r.prepDeliveryMin : r.prepPickupMin) : null;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await db.$transaction(async (tx) => {
        const last = await tx.order.findFirst({ where: { restaurantId: r.id }, orderBy: { number: "desc" }, select: { number: true } });
        const order = await tx.order.create({
          data: {
            restaurantId: r.id, number: (last?.number ?? 0) + 1, type: service,
            status: auto ? "ACCEPTED" : "PENDING",
            asap: input.when.asap, fulfillAt,
            firstName: input.customer.firstName, lastName: input.customer.lastName, email: input.customer.email,
            phone: input.customer.phone, marketingOk: !!input.customer.marketingOk,
            address: service === "DELIVERY" ? { ...input.address!, ...(input.location ?? {}) } : undefined, zoneId: zone?.id, table: table?.name ?? null, tableId: table?.id ?? null,
            payment: input.payment, comments: input.comments || null, lang: input.lang, couponCode: totals.couponCode,
            subtotal: totals.subtotal, discount: totals.discount, deliveryFee: totals.deliveryFee, tax: totals.tax, total: totals.total,
            prepMin, acceptedAt: auto ? now : null,
            readyAt: auto ? new Date(Math.max(now.getTime() + prepMin! * 60000, fulfillAt?.getTime() ?? 0)) : null,
            respondBy: auto ? null : respondBy,
            items: {
              create: lines.map((l) => ({
                itemId: l.itemId, name: l.name, sizeName: l.sizeName ?? undefined, qty: l.qty, unitPrice: l.unitPrice,
                options: l.options, instructions: l.instructions, total: l.total,
              })),
            },
          },
        });
        if (totals.couponCode) await tx.coupon.update({ where: { restaurantId_code: { restaurantId: r.id, code: totals.couponCode } }, data: { uses: { increment: 1 } } });
        return order;
      });
    } catch (e) {
      if ((e as { code?: string }).code === "P2002" && attempt < 2) continue; // order number race
      throw e;
    }
  }
  throw new OrderError("invalid");
}

/** An active table of this restaurant by its QR code, or null. */
export async function findTable(restaurantId: string, code: string | null | undefined) {
  if (!code) return null;
  const t = await db.table.findUnique({ where: { code }, select: { id: true, name: true, code: true, active: true, restaurantId: true } });
  return t && t.active && t.restaurantId === restaurantId ? t : null;
}

/** Orders still PENDING past their deadline become MISSED. Pre-orders made while closed wait until opening. Returns the ids that just became missed. */
export async function expireMissed(restaurantId?: string) {
  const due = await db.order.findMany({
    where: { status: "PENDING", respondBy: { lt: new Date() }, ...(restaurantId ? { restaurantId } : {}) },
    select: { id: true },
  });
  if (!due.length) return [];
  const ids = due.map((d) => d.id);
  await db.order.updateMany({ where: { id: { in: ids }, status: "PENDING" }, data: { status: "MISSED" } });
  return ids;
}
