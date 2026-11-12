import type { OpeningHours, Restaurant, ServiceType, SpecialDay } from "@prisma/client";
import { addDaysYmd, dowOfYmd, fromMin, localParts, toMin, zonedToUtc } from "./time";

export type RestaurantHours = Pick<
  Restaurant,
  "timezone" | "acceptingOrders" | "pausedUntil" | "pausedServices" | "pauseMessage" | "services" | "scheduledOrders" |
  "minNoticeMin" | "maxDaysAhead" | "slotMinutes" | "hideAsap"
> & { hours: OpeningHours[]; specialDays: SpecialDay[] };

type Range = { from: string; to: string };

export function rangesFor(r: RestaurantHours, service: ServiceType, ymd: string): Range[] {
  const special = r.specialDays.find((s) => s.dateFrom <= ymd && ymd <= s.dateTo && (!s.service || s.service === service));
  if (special) return special.open && special.from && special.to ? [{ from: special.from, to: special.to }] : special.open ? [] : [];
  const dow = dowOfYmd(ymd);
  const specific = r.hours.filter((h) => h.service === service);
  const list = specific.length ? specific : r.hours.filter((h) => !h.service);
  return list.filter((h) => h.days.includes(dow)).map((h) => ({ from: h.from, to: h.to }));
}

export function isPaused(r: RestaurantHours, service: ServiceType, now = new Date()) {
  return !!r.pausedUntil && r.pausedUntil > now && (r.pausedServices.length === 0 || r.pausedServices.includes(service));
}

export function isOpenNow(r: RestaurantHours, service: ServiceType, now = new Date()) {
  const lp = localParts(now, r.timezone);
  return rangesFor(r, service, lp.ymd).some((x) => toMin(x.from) <= lp.minutes && lp.minutes < toMin(x.to));
}

export function anyOpenNow(r: RestaurantHours, now = new Date()) {
  return r.services.some((s) => isOpenNow(r, s, now));
}

export function asapAllowed(r: RestaurantHours, service: ServiceType, now = new Date()) {
  return r.acceptingOrders && !r.hideAsap && !isPaused(r, service, now) && isOpenNow(r, service, now);
}

export type DaySlots = { ymd: string; times: string[] };

export function slots(r: RestaurantHours, service: ServiceType, now = new Date()): DaySlots[] {
  if (!r.acceptingOrders || !r.scheduledOrders) return [];
  const lp = localParts(now, r.timezone);
  const out: DaySlots[] = [];
  const earliest = now.getTime() + r.minNoticeMin * 60000;
  const pausedTill = isPaused(r, service, now) ? r.pausedUntil!.getTime() : 0;
  for (let d = 0; d <= Math.max(0, r.maxDaysAhead); d++) {
    const ymd = addDaysYmd(lp.ymd, d);
    const times = new Set<string>();
    for (const rg of rangesFor(r, service, ymd)) {
      for (let m = toMin(rg.from); m < toMin(rg.to); m += r.slotMinutes) {
        const at = zonedToUtc(ymd, fromMin(m), r.timezone).getTime();
        if (at < earliest || at < pausedTill) continue;
        times.add(fromMin(m));
      }
    }
    if (times.size) out.push({ ymd, times: [...times].sort() });
  }
  return out;
}

export type When = { asap: true } | { asap: false; ymd: string; time: string };

/** Returns the fulfilment Date (null for ASAP) or throws "closed". */
export function validateWhen(r: RestaurantHours, service: ServiceType, when: When, now = new Date()): Date | null {
  if (!r.acceptingOrders || !r.services.includes(service)) throw new Error("closed");
  if (when.asap) {
    if (!asapAllowed(r, service, now)) throw new Error("closed");
    return null;
  }
  const day = slots(r, service, now).find((s) => s.ymd === when.ymd);
  if (!day || !day.times.includes(when.time)) throw new Error("closed");
  return zonedToUtc(when.ymd, when.time, r.timezone);
}

/** Next moment the service opens (now if already open). Used so pre-orders placed at night wait for opening. */
export function nextOpening(r: RestaurantHours, service: ServiceType, now = new Date()): Date | null {
  if (isOpenNow(r, service, now)) return now;
  const lp = localParts(now, r.timezone);
  for (let d = 0; d <= 14; d++) {
    const ymd = addDaysYmd(lp.ymd, d);
    const starts = rangesFor(r, service, ymd).map((x) => zonedToUtc(ymd, x.from, r.timezone)).filter((t) => t > now).sort((a, b) => +a - +b);
    if (starts.length) return starts[0];
  }
  return null;
}
