import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { canManage } from "@/lib/auth";
import { saveMenuEdit } from "@/lib/menu-edit";
import { convertGloriaFoodMenu, fetchGloriaFoodMenu, ImportError, type GMenu } from "@/lib/gloriafood-import";

const body = z.object({
  key: z.string().trim().max(200).optional(),
  json: z.string().max(5_000_000).optional(), // a menu file exported from GloriaFood's API
  apply: z.boolean().default(false),
});

/** Preview (apply=false) or replace the whole menu (apply=true) with the menu from GloriaFood. */
export async function POST(req: Request, { params }: { params: Promise<{ rid: string }> }) {
  const { rid } = await params;
  const user = await canManage(rid);
  if (!user || user.role === "STAFF") return NextResponse.json({ error: "auth" }, { status: 401 });
  const p = body.safeParse(await req.json().catch(() => null));
  if (!p.success || (!p.data.key && !p.data.json)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const r = await db.restaurant.findUniqueOrThrow({ where: { id: rid }, select: { defaultLang: true } });
  try {
    let raw: GMenu;
    if (p.data.json) {
      try { raw = JSON.parse(p.data.json) as GMenu; } catch { throw new ImportError("format"); }
    } else raw = await fetchGloriaFoodMenu(p.data.key!);
    const { menu, report } = convertGloriaFoodMenu(raw, (r.defaultLang as "it") ?? "it");
    if (p.data.apply) {
      await saveMenuEdit(rid, menu);
      if (report.currency && /^[A-Z]{3}$/.test(report.currency)) await db.restaurant.update({ where: { id: rid }, data: { currency: report.currency } });
    }
    return NextResponse.json({ report, applied: p.data.apply });
  } catch (e) {
    if (e instanceof ImportError) return NextResponse.json({ error: e.code }, { status: 422 });
    throw e;
  }
}
