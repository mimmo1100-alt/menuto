import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "./db";

/** Editable shape of a restaurant's whole menu. Saved as one transaction that upserts by id and deletes what is gone. */
const l10n = z.object({ it: z.string().max(300).default(""), en: z.string().max(300).default(""), ar: z.string().max(300).default("") });
const cents = z.number().int().min(0).max(1_000_000);
const showOnly = z.object({ days: z.array(z.number().int().min(0).max(6)), from: z.string().regex(/^\d{2}:\d{2}$/), to: z.string().regex(/^\d{2}:\d{2}$/) }).nullable();

export const optionSchema = z.object({ id: z.string(), name: l10n, price: cents, preselected: z.boolean(), soldOut: z.boolean() });
export const groupSchema = z.object({
  id: z.string(), name: l10n, required: z.boolean(), min: z.number().int().min(0).max(50), max: z.number().int().min(0).max(50),
  options: z.array(optionSchema).max(100),
});
export const sizeSchema = z.object({ id: z.string(), name: l10n, price: cents, preselected: z.boolean(), groupIds: z.array(z.string()).max(20).default([]) });
export const itemSchema = z.object({
  id: z.string(), name: l10n, desc: l10n, internalName: z.string().max(80).default(""), price: cents,
  hidden: z.boolean(), soldOut: z.boolean(), labels: z.array(z.enum(["spicy", "vegetarian", "vegan", "halal", "raw"])),
  hideInstructions: z.boolean(), showOnly, sizes: z.array(sizeSchema).max(20), groupIds: z.array(z.string()).max(20),
});
export const categorySchema = z.object({
  id: z.string(), name: l10n, desc: l10n, hidden: z.boolean(), showOnly, groupIds: z.array(z.string()).max(20), items: z.array(itemSchema).max(300),
});
export const menuSchema = z.object({ categories: z.array(categorySchema).max(100), groups: z.array(groupSchema).max(200) });
export type MenuEdit = z.infer<typeof menuSchema>;

const L = (v: unknown) => ({ it: "", en: "", ar: "", ...((v as Record<string, string>) ?? {}) });
const isSoldOut = (x: { soldOutIndef: boolean; soldOutUntil: Date | null }) => x.soldOutIndef || (!!x.soldOutUntil && x.soldOutUntil > new Date());

export async function loadMenuEdit(restaurantId: string): Promise<MenuEdit> {
  const [cats, groups] = await Promise.all([
    db.category.findMany({
      where: { restaurantId }, orderBy: { position: "asc" },
      include: { groups: { orderBy: { position: "asc" } }, items: { orderBy: { position: "asc" }, include: { sizes: { orderBy: { position: "asc" }, include: { groups: { orderBy: { position: "asc" } } } }, groups: { orderBy: { position: "asc" } } } } },
    }),
    db.optionGroup.findMany({ where: { restaurantId }, orderBy: { position: "asc" }, include: { options: { orderBy: { position: "asc" } } } }),
  ]);
  return {
    groups: groups.map((g) => ({
      id: g.id, name: L(g.name), required: g.required, min: g.min, max: g.max,
      options: g.options.map((o) => ({ id: o.id, name: L(o.name), price: o.price, preselected: o.preselected, soldOut: isSoldOut(o) })),
    })),
    categories: cats.map((c) => ({
      id: c.id, name: L(c.name), desc: L(c.desc), hidden: c.hidden, showOnly: (c.showOnly as MenuEdit["categories"][number]["showOnly"]) ?? null,
      groupIds: c.groups.map((g) => g.groupId),
      items: c.items.map((i) => ({
        id: i.id, name: L(i.name), desc: L(i.desc), internalName: i.internalName ?? "", price: i.price, hidden: i.hidden, soldOut: isSoldOut(i),
        labels: i.labels as MenuEdit["categories"][number]["items"][number]["labels"], hideInstructions: i.hideInstructions,
        showOnly: (i.showOnly as MenuEdit["categories"][number]["showOnly"]) ?? null,
        sizes: i.sizes.map((s) => ({ id: s.id, name: L(s.name), price: s.price, preselected: s.preselected, groupIds: s.groups.map((g) => g.groupId) })),
        groupIds: i.groups.map((g) => g.groupId),
      })),
    })),
  };
}

const clean = (v: { it: string; en: string; ar: string }) => Object.fromEntries(Object.entries(v).filter(([, s]) => s.trim()).map(([k, s]) => [k, s.trim()]));
const soldOutData = (soldOut: boolean) => (soldOut ? { soldOutIndef: true } : { soldOutIndef: false, soldOutUntil: null });

/** Replace the restaurant's menu with `m`. Ids that do not exist yet are created (client ids starting with "new_"). */
export async function saveMenuEdit(restaurantId: string, m: MenuEdit) {
  await db.$transaction(async (tx) => {
    const own = async <T extends { id: string }>(rows: T[]) => new Set(rows.map((r) => r.id));
    const existingGroups = await own(await tx.optionGroup.findMany({ where: { restaurantId }, select: { id: true } }));
    const existingCats = await own(await tx.category.findMany({ where: { restaurantId }, select: { id: true } }));
    const existingItems = await own(await tx.item.findMany({ where: { restaurantId }, select: { id: true } }));
    const groupIdMap = new Map<string, string>();

    // option groups
    for (const [gi, g] of m.groups.entries()) {
      const data = { name: clean(g.name), required: g.required, min: g.min, max: g.max, position: gi };
      const row = existingGroups.has(g.id)
        ? await tx.optionGroup.update({ where: { id: g.id }, data })
        : await tx.optionGroup.create({ data: { ...data, restaurantId } });
      groupIdMap.set(g.id, row.id);
      const existingOpts = new Set((await tx.option.findMany({ where: { groupId: row.id }, select: { id: true } })).map((o) => o.id));
      const keep: string[] = [];
      for (const [oi, o] of g.options.entries()) {
        const od = { name: clean(o.name), price: o.price, preselected: o.preselected, position: oi, ...soldOutData(o.soldOut) };
        const orow = existingOpts.has(o.id) ? await tx.option.update({ where: { id: o.id }, data: od }) : await tx.option.create({ data: { ...od, groupId: row.id } });
        keep.push(orow.id);
      }
      await tx.option.deleteMany({ where: { groupId: row.id, id: { notIn: keep } } });
    }
    await tx.optionGroup.deleteMany({ where: { restaurantId, id: { notIn: [...groupIdMap.values()] } } });
    const gid = (id: string) => groupIdMap.get(id);

    // categories and items
    const keepCats: string[] = [];
    const keepItems: string[] = [];
    for (const [ci, c] of m.categories.entries()) {
      const cd = { name: clean(c.name), desc: clean(c.desc), hidden: c.hidden, showOnly: c.showOnly ?? Prisma.DbNull, position: ci };
      const crow = existingCats.has(c.id) ? await tx.category.update({ where: { id: c.id }, data: cd }) : await tx.category.create({ data: { ...cd, restaurantId } });
      keepCats.push(crow.id);
      await tx.categoryGroup.deleteMany({ where: { categoryId: crow.id } });
      const cg = c.groupIds.map(gid).filter(Boolean) as string[];
      if (cg.length) await tx.categoryGroup.createMany({ data: cg.map((g, i) => ({ categoryId: crow.id, groupId: g, position: i })) });

      for (const [ii, it] of c.items.entries()) {
        const idata = {
          categoryId: crow.id, name: clean(it.name), desc: clean(it.desc), internalName: it.internalName.trim() || null, price: it.price,
          hidden: it.hidden, labels: it.labels, hideInstructions: it.hideInstructions, position: ii, ...soldOutData(it.soldOut),
          showOnly: it.showOnly ?? Prisma.DbNull,
        };
        const irow = existingItems.has(it.id)
          ? await tx.item.update({ where: { id: it.id }, data: idata })
          : await tx.item.create({ data: { ...idata, restaurantId } });
        keepItems.push(irow.id);
        await tx.itemSize.deleteMany({ where: { itemId: irow.id } });
        for (const [si, sz] of it.sizes.entries()) {
          const sg = sz.groupIds.map(gid).filter((g): g is string => !!g && !cg.includes(g));
          await tx.itemSize.create({
            data: {
              itemId: irow.id, name: clean(sz.name), price: sz.price, preselected: sz.preselected, position: si,
              groups: sg.length ? { create: sg.map((g, gi) => ({ groupId: g, position: gi })) } : undefined,
            },
          });
        }
        await tx.itemGroup.deleteMany({ where: { itemId: irow.id } });
        const ig = it.groupIds.map(gid).filter((g): g is string => !!g && !cg.includes(g));
        if (ig.length) await tx.itemGroup.createMany({ data: ig.map((g, i) => ({ itemId: irow.id, groupId: g, position: i })) });
      }
    }
    await tx.item.deleteMany({ where: { restaurantId, id: { notIn: keepItems } } });
    await tx.category.deleteMany({ where: { restaurantId, id: { notIn: keepCats } } });
  }, { timeout: 30000 });
}
