import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "./db";

const hhmm = z.string().regex(/^\d{2}:\d{2}$/);
const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const svc = z.enum(["PICKUP", "DELIVERY", "DINEIN"]);
const cents = z.number().int().min(0).max(1_000_000);
const PAY = ["cash", "card_counter", "card_courier", "card_table"] as const;

export const settingsSchema = z.object({
  name: z.string().trim().min(1).max(80), phone: z.string().trim().min(3).max(30),
  lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180), allowOutsideZones: z.boolean(),
  address: z.string().trim().min(1).max(120), city: z.string().trim().min(1).max(80), postcode: z.string().trim().max(12),
  defaultLang: z.enum(["it", "en", "ar"]),
  acceptingOrders: z.boolean(),
  pause: z.object({ until: z.string().datetime().nullable(), services: z.array(svc), message: z.string().max(200) }),
  services: z.array(svc).min(1),
  payments: z.object({ PICKUP: z.array(z.enum(PAY)), DELIVERY: z.array(z.enum(PAY)), DINEIN: z.array(z.enum(PAY)) }),
  scheduledOrders: z.boolean(), minNoticeMin: z.number().int().min(0).max(10080), maxDaysAhead: z.number().int().min(0).max(30),
  slotMinutes: z.number().int().refine((n) => [15, 30, 45, 60, 90, 120, 180, 240, 360].includes(n)), hideAsap: z.boolean(),
  autoAccept: z.boolean(), prepPickupMin: z.number().int().min(1).max(600), prepDeliveryMin: z.number().int().min(1).max(600),
  taxIncluded: z.boolean(), taxName: z.string().trim().min(1).max(20), taxRateBp: z.number().int().min(0).max(5000),
  notifyEmails: z.array(z.string().trim().email()).max(10),
  hours: z.array(z.object({ service: svc.nullable(), days: z.array(z.number().int().min(0).max(6)).min(1), from: hhmm, to: hhmm })).max(50),
  specialDays: z.array(z.object({
    name: z.string().trim().min(1).max(25), dateFrom: ymd, dateTo: ymd, service: svc.nullable(), open: z.boolean(),
    from: hhmm.nullable(), to: hhmm.nullable(), message: z.string().max(200),
  })).max(100),
  zones: z.array(z.object({
    id: z.string(), name: z.string().trim().min(1).max(40), color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    minOrder: cents, fee: cents, prepMin: z.number().int().min(1).max(600).nullable(), hidden: z.boolean(),
    kind: z.enum(["circle", "polygon"]), centerLat: z.number().nullable(), centerLng: z.number().nullable(), radiusM: z.number().int().min(100).max(50000).nullable(),
    polygon: z.array(z.tuple([z.number(), z.number()])).max(200).nullable(),
  }).refine((z) => (z.kind === "circle" ? z.centerLat != null && z.centerLng != null && z.radiusM != null : (z.polygon?.length ?? 0) >= 3), { message: "shape" })).max(30),
  coupons: z.array(z.object({
    id: z.string(), code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{4,20}$/), kind: z.enum(["percent", "fixed", "free_delivery"]),
    value: z.number().int().min(0).max(1_000_000), minOrder: cents, onePerCustomer: z.boolean(), active: z.boolean(), validTo: ymd.nullable(),
  })).max(100),
});
export type SettingsEdit = z.infer<typeof settingsSchema>;

export async function loadSettings(restaurantId: string): Promise<SettingsEdit & { uses: Record<string, number> }> {
  const r = await db.restaurant.findUniqueOrThrow({
    where: { id: restaurantId },
    include: { hours: true, specialDays: { orderBy: { dateFrom: "asc" } }, zones: { orderBy: { position: "asc" } }, coupons: { orderBy: { code: "asc" } } },
  });
  const pay = r.payments as Record<string, string[]>;
  return {
    name: r.name, phone: r.phone, lat: r.lat ?? 45.4642, lng: r.lng ?? 9.19, allowOutsideZones: r.allowOutsideZones, address: r.address, city: r.city, postcode: r.postcode ?? "", defaultLang: r.defaultLang as "it",
    acceptingOrders: r.acceptingOrders,
    pause: { until: r.pausedUntil && r.pausedUntil > new Date() ? r.pausedUntil.toISOString() : null, services: r.pausedServices, message: r.pauseMessage ?? "" },
    services: r.services,
    payments: { PICKUP: (pay.PICKUP ?? []) as never, DELIVERY: (pay.DELIVERY ?? []) as never, DINEIN: (pay.DINEIN ?? []) as never },
    scheduledOrders: r.scheduledOrders, minNoticeMin: r.minNoticeMin, maxDaysAhead: r.maxDaysAhead, slotMinutes: r.slotMinutes, hideAsap: r.hideAsap,
    autoAccept: r.autoAccept, prepPickupMin: r.prepPickupMin, prepDeliveryMin: r.prepDeliveryMin,
    taxIncluded: r.taxIncluded, taxName: r.taxName, taxRateBp: r.taxRateBp, notifyEmails: r.notifyEmails,
    hours: r.hours.map((h) => ({ service: h.service, days: h.days, from: h.from, to: h.to })),
    specialDays: r.specialDays.map((s) => ({ name: s.name, dateFrom: s.dateFrom, dateTo: s.dateTo, service: s.service, open: s.open, from: s.from, to: s.to, message: s.message ?? "" })),
    zones: r.zones.map((z) => ({
      id: z.id, name: z.name, color: z.color, minOrder: z.minOrder, fee: z.fee, prepMin: z.prepMin, hidden: z.hidden,
      kind: (z.kind === "polygon" ? "polygon" : "circle") as "circle", centerLat: z.centerLat, centerLng: z.centerLng, radiusM: z.radiusM,
      polygon: (z.polygon as [number, number][] | null) ?? null,
    })),
    coupons: r.coupons.map((c) => ({ id: c.id, code: c.code, kind: c.kind as "percent", value: c.value, minOrder: c.minOrder, onePerCustomer: c.onePerCustomer, active: c.active, validTo: c.validTo ? c.validTo.toISOString().slice(0, 10) : null })),
    uses: Object.fromEntries(r.coupons.map((c) => [c.id, c.uses])),
  };
}

export async function saveSettings(restaurantId: string, s: SettingsEdit) {
  const codes = s.coupons.map((c) => c.code);
  if (new Set(codes).size !== codes.length) throw new Error("duplicate_coupon");
  await db.$transaction(async (tx) => {
    await tx.restaurant.update({
      where: { id: restaurantId },
      data: {
        name: s.name, phone: s.phone, lat: s.lat, lng: s.lng, allowOutsideZones: s.allowOutsideZones, address: s.address, city: s.city, postcode: s.postcode || null, defaultLang: s.defaultLang,
        acceptingOrders: s.acceptingOrders,
        pausedUntil: s.pause.until ? new Date(s.pause.until) : null, pausedServices: s.pause.services, pauseMessage: s.pause.message || null,
        services: s.services, payments: s.payments,
        scheduledOrders: s.scheduledOrders, minNoticeMin: s.minNoticeMin, maxDaysAhead: s.maxDaysAhead, slotMinutes: s.slotMinutes, hideAsap: s.hideAsap,
        autoAccept: s.autoAccept, prepPickupMin: s.prepPickupMin, prepDeliveryMin: s.prepDeliveryMin,
        taxIncluded: s.taxIncluded, taxName: s.taxName, taxRateBp: s.taxRateBp, notifyEmails: s.notifyEmails,
      },
    });
    await tx.openingHours.deleteMany({ where: { restaurantId } });
    if (s.hours.length) await tx.openingHours.createMany({ data: s.hours.map((h) => ({ ...h, restaurantId })) });
    await tx.specialDay.deleteMany({ where: { restaurantId } });
    if (s.specialDays.length) await tx.specialDay.createMany({ data: s.specialDays.map((d) => ({ ...d, message: d.message || null, restaurantId })) });

    const zoneIds = new Set((await tx.deliveryZone.findMany({ where: { restaurantId }, select: { id: true } })).map((z) => z.id));
    const keepZones: string[] = [];
    for (const [i, z] of s.zones.entries()) {
      const data = {
        name: z.name, color: z.color, minOrder: z.minOrder, fee: z.fee, prepMin: z.prepMin, hidden: z.hidden, position: i,
        kind: z.kind, centerLat: z.centerLat, centerLng: z.centerLng, radiusM: z.radiusM, polygon: z.polygon ?? Prisma.DbNull,
      };
      const row = zoneIds.has(z.id) ? await tx.deliveryZone.update({ where: { id: z.id }, data }) : await tx.deliveryZone.create({ data: { ...data, restaurantId } });
      keepZones.push(row.id);
    }
    await tx.deliveryZone.deleteMany({ where: { restaurantId, id: { notIn: keepZones } } });

    const couponIds = new Set((await tx.coupon.findMany({ where: { restaurantId }, select: { id: true } })).map((c) => c.id));
    // free codes first so a renamed coupon can take a code another one is giving up
    await tx.coupon.deleteMany({ where: { restaurantId, id: { notIn: s.coupons.map((c) => c.id) } } });
    for (const c of s.coupons) {
      const data = { code: c.code, kind: c.kind, value: c.value, minOrder: c.minOrder, onePerCustomer: c.onePerCustomer, active: c.active, validTo: c.validTo ? new Date(`${c.validTo}T23:59:59Z`) : null };
      if (couponIds.has(c.id)) await tx.coupon.update({ where: { id: c.id }, data });
      else await tx.coupon.create({ data: { ...data, restaurantId } });
    }
  }, { timeout: 30000 });
}
