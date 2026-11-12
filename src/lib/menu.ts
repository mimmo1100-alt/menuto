import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { localParts, toMin } from "./time";

export const restaurantInclude = {
  hours: true,
  specialDays: true,
  zones: { where: { hidden: false }, orderBy: { position: "asc" } },
  categories: {
    orderBy: { position: "asc" },
    include: {
      groups: { orderBy: { position: "asc" }, include: { group: { include: { options: { orderBy: { position: "asc" } } } } } },
      items: {
        orderBy: { position: "asc" },
        include: {
          sizes: { orderBy: { position: "asc" } },
          groups: { orderBy: { position: "asc" }, include: { group: { include: { options: { orderBy: { position: "asc" } } } } } },
        },
      },
    },
  },
  partner: { select: { imprint: true } },
} satisfies Prisma.RestaurantInclude;

export type FullRestaurant = Prisma.RestaurantGetPayload<{ include: typeof restaurantInclude }>;

export type L = Record<string, string>;
export type PubOption = { id: string; name: L; price: number; preselected: boolean; soldOut: boolean };
export type PubGroup = { id: string; name: L; required: boolean; min: number; max: number; options: PubOption[] };
export type PubItem = {
  id: string; name: L; desc: L | null; image: string | null; price: number; soldOut: boolean;
  labels: string[]; hideInstructions: boolean;
  sizes: { id: string; name: L; price: number; preselected: boolean }[];
  groups: PubGroup[];
};
export type PubCategory = { id: string; name: L; desc: L | null; image: string | null; items: PubItem[] };

type ShowOnly = { days?: number[]; from?: string; to?: string } | null;
function shownNow(showOnly: unknown, tz: string, now: Date) {
  const s = showOnly as ShowOnly;
  if (!s) return true;
  const lp = localParts(now, tz);
  if (s.days && !s.days.includes(lp.dow)) return false;
  if (s.from && s.to && !(toMin(s.from) <= lp.minutes && lp.minutes < toMin(s.to))) return false;
  return true;
}
const soldOut = (x: { soldOutIndef: boolean; soldOutUntil: Date | null }, now: Date) =>
  x.soldOutIndef || (!!x.soldOutUntil && x.soldOutUntil > now);

export async function loadRestaurant(slug: string) {
  return db.restaurant.findUnique({ where: { slug }, include: restaurantInclude });
}
export async function loadRestaurantById(id: string) {
  return db.restaurant.findUnique({ where: { id }, include: restaurantInclude });
}

export function publicMenu(r: FullRestaurant, now = new Date()): PubCategory[] {
  const pubGroup = (g: FullRestaurant["categories"][number]["groups"][number]["group"]): PubGroup => ({
    id: g.id, name: g.name as L, required: g.required, min: g.min, max: g.max,
    options: g.options.map((o) => ({ id: o.id, name: o.name as L, price: o.price, preselected: o.preselected, soldOut: soldOut(o, now) })),
  });
  return r.categories
    .filter((c) => !c.hidden && !(c.hiddenUntil && c.hiddenUntil > now) && shownNow(c.showOnly, r.timezone, now))
    .map((c) => ({
      id: c.id, name: c.name as L, desc: (c.desc as L) ?? null, image: c.image,
      items: c.items
        .filter((i) => !i.hidden && !(i.hiddenUntil && i.hiddenUntil > now) && shownNow(i.showOnly, r.timezone, now))
        .map((i) => {
          const seen = new Set<string>();
          const groups = [...c.groups, ...i.groups]
            .map((x) => x.group)
            .filter((g) => (seen.has(g.id) ? false : (seen.add(g.id), true)))
            .map(pubGroup);
          return {
            id: i.id, name: i.name as L, desc: (i.desc as L) ?? null, image: i.image, price: i.price, soldOut: soldOut(i, now),
            labels: i.labels, hideInstructions: i.hideInstructions,
            sizes: i.sizes.map((s) => ({ id: s.id, name: s.name as L, price: s.price, preselected: s.preselected })),
            groups,
          };
        }),
    }))
    .filter((c) => c.items.length > 0);
}
