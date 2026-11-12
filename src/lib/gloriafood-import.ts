import type { MenuEdit } from "./menu-edit";

/**
 * Import from GloriaFood's "Fetch Menu" API, version 2
 * (https://github.com/GlobalFood/integration_docs/tree/master/fetch_menu).
 * The restaurant creates the key in GloriaFood: Admin → Others → 3rd party integrations → "Fetch Menu".
 */
export const GLORIAFOOD_MENU_URL = "https://pos.globalfoodsoft.com/pos/menu";

type GOption = { id: number; name: string; price: number; default?: boolean };
type GGroup = { id: number; name: string; required?: boolean; force_min?: number; force_max?: number; options?: GOption[] };
type GSize = { id: number; name: string; price: number; default?: boolean; groups?: GGroup[] };
type GItem = {
  id: number; name: string; description?: string | null; price: number; active?: boolean; active_days?: number;
  active_begin?: string | null; active_end?: string | null; tags?: string[] | null;
  extras?: { menu_item_kitchen_internal_name?: string } | null; sizes?: GSize[]; groups?: GGroup[];
};
type GCategory = { id: number; name: string; active?: boolean; active_days?: number; active_begin?: string | null; active_end?: string | null; items?: GItem[]; groups?: GGroup[] };
export type GMenu = { id?: number; currency?: string; categories?: GCategory[] };

export class ImportError extends Error {
  constructor(public code: "key" | "unreachable" | "format") { super(code); }
}

export async function fetchGloriaFoodMenu(key: string): Promise<GMenu> {
  let res: Response;
  try {
    res = await fetch(GLORIAFOOD_MENU_URL, {
      headers: { Authorization: key.trim(), Accept: "application/json", "Glf-Api-Version": "2" },
      signal: AbortSignal.timeout(20000),
      cache: "no-store",
    });
  } catch {
    throw new ImportError("unreachable");
  }
  if (res.status === 401 || res.status === 403 || res.status === 404) throw new ImportError("key");
  if (!res.ok) throw new ImportError("unreachable");
  try { return (await res.json()) as GMenu; } catch { throw new ImportError("format"); }
}

const TAGS: Record<string, MenuEdit["categories"][number]["items"][number]["labels"][number]> = {
  HOT: "spicy", VEGETARIAN: "vegetarian", VEGAN: "vegan", HALAL: "halal", RAW: "raw",
};
const cents = (n: unknown) => Math.max(0, Math.round((Number(n) || 0) * 100));

export type ImportReport = {
  currency: string | null; categories: number; items: number; sizes: number; groups: number; options: number;
  hidden: number; withSchedule: number;
};

/** GloriaFood names come in one language: they are stored under the restaurant's menu language. */
export function convertGloriaFoodMenu(m: GMenu, lang: "it" | "en" | "ar" = "it"): { menu: MenuEdit; report: ImportReport } {
  if (!m || !Array.isArray(m.categories)) throw new ImportError("format");
  const L = (s: string | null | undefined) => ({ it: "", en: "", ar: "", [lang]: (s ?? "").trim() });
  const groups = new Map<number, MenuEdit["groups"][number]>();
  const gid = (g: GGroup) => {
    if (!groups.has(g.id)) {
      const required = !!g.required;
      groups.set(g.id, {
        id: `new_gf_g${g.id}`, name: L(g.name), required,
        // GloriaFood enforces the minimum only on required groups
        min: required ? Math.max(1, g.force_min ?? 1) : 0,
        max: Math.max(0, g.force_max ?? 0),
        options: (g.options ?? []).map((o) => ({ id: `new_gf_o${o.id}`, name: L(o.name), price: cents(o.price), preselected: !!o.default, soldOut: false })),
      });
    }
    return `new_gf_g${g.id}`;
  };
  const scheduled = (x: { active_days?: number; active_begin?: string | null; active_end?: string | null }) =>
    (x.active_days != null && x.active_days !== 127) || !!x.active_begin || !!x.active_end;

  const report: ImportReport = { currency: m.currency ?? null, categories: 0, items: 0, sizes: 0, groups: 0, options: 0, hidden: 0, withSchedule: 0 };
  const categories: MenuEdit["categories"] = (m.categories ?? []).map((c) => {
    report.categories++;
    if (scheduled(c)) report.withSchedule++;
    if (c.active === false) report.hidden++;
    const catGroups = (c.groups ?? []).map(gid);
    return {
      id: `new_gf_c${c.id}`, name: L(c.name), desc: L(""), hidden: c.active === false, showOnly: null, groupIds: catGroups,
      items: (c.items ?? []).map((it) => {
        report.items++;
        if (scheduled(it)) report.withSchedule++;
        if (it.active === false) report.hidden++;
        const sizes = it.sizes ?? [];
        report.sizes += sizes.length;
        // size groups: when every size offers the same groups, keep them on the item; otherwise per size
        const sets = sizes.map((s) => (s.groups ?? []).map(gid));
        const same = sets.length > 0 && sets.every((x) => x.join() === sets[0].join());
        const itemGroups = [...(it.groups ?? []).map(gid), ...(same ? sets[0] : [])].filter((g, i, a) => a.indexOf(g) === i && !catGroups.includes(g));
        const anyDefault = sizes.some((s) => s.default);
        return {
          id: `new_gf_i${it.id}`, name: L(it.name), desc: L(it.description ?? ""),
          internalName: it.extras?.menu_item_kitchen_internal_name?.trim() ?? "",
          price: cents(it.price), hidden: it.active === false, soldOut: false,
          labels: [...new Set((it.tags ?? []).map((t) => TAGS[t]).filter(Boolean))],
          hideInstructions: false, showOnly: null,
          // GloriaFood size prices are added to the item price
          sizes: sizes.map((s, i) => ({
            id: `new_gf_s${s.id}`, name: L(s.name), price: cents(it.price) + cents(s.price),
            preselected: anyDefault ? !!s.default : i === 0,
            groupIds: same ? [] : sets[i].filter((g) => !itemGroups.includes(g) && !catGroups.includes(g)),
          })),
          groupIds: itemGroups,
        };
      }),
    };
  });
  const menu: MenuEdit = { categories, groups: [...groups.values()] };
  report.groups = menu.groups.length;
  report.options = menu.groups.reduce((a, g) => a + g.options.length, 0);
  return { menu, report };
}
