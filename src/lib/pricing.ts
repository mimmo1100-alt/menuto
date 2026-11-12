import type { Coupon, DeliveryZone, Restaurant } from "@prisma/client";
import type { L, PubCategory, PubItem } from "./menu";

export type CartLineInput = { itemId: string; sizeId?: string | null; optionIds: string[]; qty: number; instructions?: string };
export type PricedLine = {
  itemId: string; name: L; sizeName: L | null; qty: number; unitPrice: number; total: number;
  options: { group: L; name: L; price: number }[]; instructions: string | null;
};

export class OrderError extends Error {
  constructor(public code: "item" | "closed" | "min" | "zone" | "invalid" | "coupon" | "table") { super(code); }
}

/** Count rule for a group: returns [min, max] where max 0 = unlimited. */
export function groupBounds(g: { required: boolean; min: number; max: number }) {
  const min = Math.max(g.min, g.required ? 1 : 0);
  return [min, g.max] as const;
}

export function priceLine(item: PubItem, line: CartLineInput): PricedLine {
  if (item.soldOut || line.qty < 1 || line.qty > 99) throw new OrderError("item");
  let base = item.price;
  let sizeName: L | null = null;
  let groups = item.groups;
  if (item.sizes.length) {
    const s = item.sizes.find((x) => x.id === line.sizeId);
    if (!s) throw new OrderError("item");
    base = s.price; sizeName = s.name;
    groups = [...item.groups, ...s.groups];
  }
  const chosen = new Set(line.optionIds);
  const options: PricedLine["options"] = [];
  let used = 0;
  for (const g of groups) {
    const picked = g.options.filter((o) => chosen.has(o.id));
    if (picked.some((o) => o.soldOut)) throw new OrderError("item");
    const [min, max] = groupBounds(g);
    if (picked.length < min || (max > 0 && picked.length > max)) throw new OrderError("item");
    for (const o of picked) { options.push({ group: g.name, name: o.name, price: o.price }); base += o.price; used++; }
  }
  if (used !== chosen.size) throw new OrderError("item");
  return {
    itemId: item.id, name: item.name, sizeName, qty: line.qty, unitPrice: base, total: base * line.qty, options,
    instructions: item.hideInstructions ? null : (line.instructions?.trim().slice(0, 200) || null),
  };
}

export function findItem(menu: PubCategory[], id: string) {
  for (const c of menu) for (const i of c.items) if (i.id === id) return i;
  return null;
}

export type Totals = { subtotal: number; discount: number; deliveryFee: number; tax: number; total: number; couponCode: string | null };

export function computeTotals(
  r: Pick<Restaurant, "taxIncluded" | "taxRateBp">,
  lines: PricedLine[],
  opts: { zone?: DeliveryZone | null; coupon?: Coupon | null; isDelivery: boolean },
): Totals {
  const subtotal = lines.reduce((a, l) => a + l.total, 0);
  if (opts.isDelivery && opts.zone && subtotal < opts.zone.minOrder) throw new OrderError("min");
  let deliveryFee = opts.isDelivery && opts.zone ? opts.zone.fee : 0;
  let discount = 0;
  const c = opts.coupon;
  if (c) {
    if (subtotal < c.minOrder) throw new OrderError("coupon");
    if (c.kind === "percent") discount = Math.round((subtotal * c.value) / 100);
    else if (c.kind === "fixed") discount = Math.min(subtotal, c.value);
    else if (c.kind === "free_delivery") deliveryFee = 0;
  }
  const taxable = subtotal - discount;
  const tax = r.taxIncluded
    ? Math.round((taxable * r.taxRateBp) / (10000 + r.taxRateBp))
    : Math.round((taxable * r.taxRateBp) / 10000);
  const total = taxable + deliveryFee + (r.taxIncluded ? 0 : tax);
  return { subtotal, discount, deliveryFee, tax, total, couponCode: c?.code ?? null };
}

export function couponUsable(c: Coupon | null, now = new Date()) {
  return !!c && c.active && !(c.validFrom && c.validFrom > now) && !(c.validTo && c.validTo < now);
}
