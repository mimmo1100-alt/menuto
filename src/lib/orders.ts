import { z } from "zod";
import type { ServiceType } from "@prisma/client";
import { db } from "./db";
import { loadRestaurant, publicMenu, type FullRestaurant } from "./menu";
import { computeTotals, couponUsable, findItem, OrderError, priceLine, type PricedLine } from "./pricing";
import { nextOpening, validateWhen } from "./availability";

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
    firstName: z.string().trim().min(1).max(60), lastName: z.string().trim().min(1).max(60),
    email: z.string().trim().email().max(120), phone: z.string().trim().min(6).max(30), marketingOk: z.boolean().optional(),
  }),
  address: z.object({ street: z.string().trim().min(2).max(120), city: z.string().trim().min(1).max(80), more: z.string().trim().max(160).optional() }).nullish(),
  zoneId: z.string().nullish(),
  table: z.string().trim().max(20).nullish(),
  payment: z.string().min(1).max(30),
  comments: z.string().trim().max(500).optional(),
  coupon: z.string().trim().max(40).optional(),
  lang: z.enum(["it", "en", "ar"]).default("it"),
});
export type OrderInput = z.infer<typeof orderSchema>;
export const quoteSchema = orderSchema.pick({ lines: true, type: true, zoneId: true, coupon: true });

export async function quote(r: FullRestaurant, input: z.infer<typeof quoteSchema>) {
  const menu = publicMenu(r);
  const lines: PricedLine[] = input.lines.map((l) => {
    const item = findItem(menu, l.itemId);
    if (!item) throw new OrderError("item");
    return priceLine(item, l);
  });
  const isDelivery = input.type === "DELIVERY";
  const zone = isDelivery ? r.zones.find((z) => z.id === input.zoneId) ?? null : null;
  if (isDelivery && r.zones.length && !zone) throw new OrderError("zone");
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
            address: service === "DELIVERY" ? input.address! : undefined, zoneId: zone?.id, table: input.table ?? null,
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

/** Orders still PENDING past their deadline become MISSED. Pre-orders made while closed wait until opening. */
export async function expireMissed(restaurantId?: string) {
  await db.order.updateMany({
    where: { status: "PENDING", respondBy: { lt: new Date() }, ...(restaurantId ? { restaurantId } : {}) },
    data: { status: "MISSED" },
  });
}
