import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "./db";
import { currentUser } from "./auth";

export async function requirePartner() {
  const u = await currentUser();
  return u && u.role === "PARTNER" && u.partnerId ? u : null;
}

const DONE = ["ACCEPTED", "READY", "COMPLETED"] as const;

export async function partnerOverview(partnerId: string) {
  const since = new Date(Date.now() - 7 * 864e5);
  const [partner, restaurants, sold, missed, last] = await Promise.all([
    db.partner.findUniqueOrThrow({ where: { id: partnerId } }),
    db.restaurant.findMany({ where: { partnerId }, orderBy: { name: "asc" }, select: { id: true, name: true, slug: true, city: true, isDemo: true, acceptingOrders: true, currency: true, createdAt: true, users: { where: { role: "OWNER" }, select: { email: true } } } }),
    db.order.groupBy({ by: ["restaurantId"], where: { restaurant: { partnerId }, createdAt: { gte: since }, status: { in: [...DONE] } }, _count: true, _sum: { total: true } }),
    db.order.groupBy({ by: ["restaurantId"], where: { restaurant: { partnerId }, createdAt: { gte: since }, status: "MISSED" }, _count: true }),
    db.order.groupBy({ by: ["restaurantId"], where: { restaurant: { partnerId } }, _max: { createdAt: true } }),
  ]);
  const by = <T extends { restaurantId: string }>(rows: T[]) => new Map(rows.map((r) => [r.restaurantId, r]));
  const s = by(sold), m = by(missed), l = by(last);
  return {
    partner: { name: partner.name, imprint: partner.imprint ?? "" },
    restaurants: restaurants.map((r) => ({
      id: r.id, name: r.name, slug: r.slug, city: r.city, isDemo: r.isDemo, accepting: r.acceptingOrders, currency: r.currency,
      owners: r.users.map((u) => u.email),
      orders7: s.get(r.id)?._count ?? 0, sales7: s.get(r.id)?._sum.total ?? 0, missed7: m.get(r.id)?._count ?? 0,
      lastOrderAt: l.get(r.id)?._max.createdAt?.toISOString() ?? null,
    })),
  };
}

export const newRestaurantSchema = z.object({
  name: z.string().trim().min(2).max(80), phone: z.string().trim().min(3).max(30),
  address: z.string().trim().min(1).max(120), city: z.string().trim().min(1).max(80),
  ownerEmail: z.string().trim().toLowerCase().email().optional().or(z.literal("")),
  ownerPassword: z.string().min(8).max(200).optional().or(z.literal("")),
});

const slugify = (s: string) => s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "ristorante";

export async function createRestaurant(partnerId: string, input: z.infer<typeof newRestaurantSchema>) {
  if (input.ownerEmail && !input.ownerPassword) throw new Error("password");
  if (input.ownerEmail && (await db.user.findUnique({ where: { email: input.ownerEmail } }))) throw new Error("email_taken");
  const base = slugify(input.name);
  let slug = base;
  for (let i = 2; await db.restaurant.findUnique({ where: { slug } }); i++) slug = `${base}-${i}`;
  return db.$transaction(async (tx) => {
    const r = await tx.restaurant.create({
      data: {
        slug, name: input.name, phone: input.phone, address: input.address, city: input.city, partnerId,
        services: ["PICKUP"], notifyEmails: input.ownerEmail ? [input.ownerEmail] : [],
        hours: { create: [{ days: [0, 1, 2, 3, 4, 5, 6], from: "12:00", to: "22:00" }] },
      },
    });
    if (input.ownerEmail && input.ownerPassword) {
      await tx.user.create({ data: { email: input.ownerEmail, passwordHash: await bcrypt.hash(input.ownerPassword, 10), role: "OWNER", restaurantId: r.id } });
    }
    return r;
  });
}

export async function partnerOrders(partnerId: string, f: { status?: string; type?: string; days: number; restaurantId?: string }) {
  return db.order.findMany({
    where: {
      restaurant: { partnerId }, createdAt: { gte: new Date(Date.now() - f.days * 864e5) },
      ...(f.status ? { status: f.status as never } : {}), ...(f.type ? { type: f.type as never } : {}), ...(f.restaurantId ? { restaurantId: f.restaurantId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 1000,
    select: { id: true, number: true, status: true, type: true, total: true, payment: true, createdAt: true, firstName: true, lastName: true, restaurant: { select: { name: true, currency: true } } },
  });
}
