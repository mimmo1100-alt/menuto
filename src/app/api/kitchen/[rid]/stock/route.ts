import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { canManage } from "@/lib/auth";
import { addDaysYmd, localParts, zonedToUtc } from "@/lib/time";

const body = z.object({ kind: z.enum(["item", "option"]), id: z.string(), state: z.enum(["available", "tomorrow", "indefinite"]) });

/** Items and options with their sold-out state, for the orders app. */
export async function GET(_req: Request, { params }: { params: Promise<{ rid: string }> }) {
  const { rid } = await params;
  if (!(await canManage(rid))) return NextResponse.json({ error: "auth" }, { status: 401 });
  const now = new Date();
  const [cats, groups] = await Promise.all([
    db.category.findMany({ where: { restaurantId: rid }, orderBy: { position: "asc" }, select: { id: true, name: true, items: { orderBy: { position: "asc" }, select: { id: true, name: true, soldOutIndef: true, soldOutUntil: true } } } }),
    db.optionGroup.findMany({ where: { restaurantId: rid }, orderBy: { position: "asc" }, select: { id: true, name: true, options: { orderBy: { position: "asc" }, select: { id: true, name: true, soldOutIndef: true, soldOutUntil: true } } } }),
  ]);
  const st = (x: { soldOutIndef: boolean; soldOutUntil: Date | null }) => (x.soldOutIndef ? "indefinite" : x.soldOutUntil && x.soldOutUntil > now ? "tomorrow" : "available");
  return NextResponse.json({
    categories: cats.map((c) => ({ id: c.id, name: c.name, items: c.items.map((i) => ({ id: i.id, name: i.name, state: st(i) })) })),
    groups: groups.map((g) => ({ id: g.id, name: g.name, options: g.options.map((o) => ({ id: o.id, name: o.name, state: st(o) })) })),
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ rid: string }> }) {
  const { rid } = await params;
  if (!(await canManage(rid))) return NextResponse.json({ error: "auth" }, { status: 401 });
  const p = body.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const r = await db.restaurant.findUniqueOrThrow({ where: { id: rid }, select: { timezone: true } });
  const tomorrow = zonedToUtc(addDaysYmd(localParts(new Date(), r.timezone).ymd, 1), "00:00", r.timezone);
  const data = p.data.state === "available" ? { soldOutIndef: false, soldOutUntil: null }
    : p.data.state === "tomorrow" ? { soldOutIndef: false, soldOutUntil: tomorrow } : { soldOutIndef: true, soldOutUntil: null };
  const res = p.data.kind === "item"
    ? await db.item.updateMany({ where: { id: p.data.id, restaurantId: rid }, data })
    : await db.option.updateMany({ where: { id: p.data.id, group: { restaurantId: rid } }, data });
  if (!res.count) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
