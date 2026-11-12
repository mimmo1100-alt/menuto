import { randomBytes } from "crypto";
import { z } from "zod";
import { db } from "./db";

const PAY = ["cash", "card_table"] as const;

export const tablesSchema = z.object({
  dineIn: z.boolean(),
  payments: z.array(z.enum(PAY)).max(2),
  tables: z.array(z.object({ id: z.string().max(40), name: z.string().trim().min(1).max(20), active: z.boolean() })).max(300),
});
export type TablesEdit = z.infer<typeof tablesSchema>;

/** 8 url-safe characters (48 bits): a table link can't be guessed from another one. */
export const newTableCode = () => randomBytes(6).toString("base64url");

export async function loadTables(restaurantId: string) {
  const r = await db.restaurant.findUniqueOrThrow({
    where: { id: restaurantId },
    select: { services: true, payments: true, tables: { orderBy: [{ position: "asc" }, { createdAt: "asc" }], select: { id: true, name: true, code: true, active: true } } },
  });
  const pay = ((r.payments as Record<string, string[]>).DINEIN ?? []).filter((p): p is (typeof PAY)[number] => (PAY as readonly string[]).includes(p));
  return { dineIn: r.services.includes("DINEIN"), payments: pay, tables: r.tables };
}

/** Saves the whole list: rows without a known id are created (with a new code), missing rows are removed. */
export async function saveTables(restaurantId: string, s: TablesEdit) {
  const names = s.tables.map((t) => t.name.toLowerCase());
  if (new Set(names).size !== names.length) throw new Error("duplicate_table");
  if (s.dineIn && !s.payments.length) throw new Error("payments");
  await db.$transaction(async (tx) => {
    const r = await tx.restaurant.findUniqueOrThrow({ where: { id: restaurantId }, select: { services: true, payments: true } });
    const others = r.services.filter((x) => x !== "DINEIN");
    if (!s.dineIn && !others.length) throw new Error("services");
    await tx.restaurant.update({
      where: { id: restaurantId },
      data: { services: s.dineIn ? [...others, "DINEIN"] : others, payments: { ...(r.payments as object), DINEIN: s.payments } },
    });
    const existing = await tx.table.findMany({ where: { restaurantId }, select: { id: true } });
    const known = new Set(existing.map((e) => e.id));
    const keep = s.tables.filter((t) => known.has(t.id)).map((t) => t.id);
    await tx.table.deleteMany({ where: { restaurantId, id: { notIn: keep } } });
    for (const [i, t] of s.tables.entries()) {
      if (known.has(t.id)) await tx.table.update({ where: { id: t.id }, data: { name: t.name, active: t.active, position: i } });
      else await tx.table.create({ data: { restaurantId, name: t.name, active: t.active, position: i, code: newTableCode() } });
    }
  });
}
