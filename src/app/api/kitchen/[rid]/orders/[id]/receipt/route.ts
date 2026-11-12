import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import { canManage } from "@/lib/auth";
import { buildReceipt, toEscPos, toHtml, toText, type Template } from "@/lib/receipt";
import type { Lang } from "@/lib/i18n";

/** ?t=kitchen,customer  &f=html|text|escpos  &cols=42|32 */
export async function GET(req: Request, { params }: { params: Promise<{ rid: string; id: string }> }) {
  const { rid, id } = await params;
  if (!(await canManage(rid))) return NextResponse.json({ error: "auth" }, { status: 401 });
  const o = await db.order.findFirst({ where: { id, restaurantId: rid }, include: { items: true, restaurant: { include: { partner: { select: { imprint: true } } } } } });
  if (!o) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const q = new URL(req.url).searchParams;
  const templates = (q.get("t") ?? "kitchen").split(",").filter((x): x is Template => x === "kitchen" || x === "customer");
  const cols = q.get("cols") === "32" ? 32 : 42;
  const lang = ((q.get("lang") as Lang) || (o.restaurant.defaultLang as Lang) || "it");
  const origin = process.env.PUBLIC_URL ?? new URL(req.url).origin;
  const pages = templates.map((tp) => ({ lines: buildReceipt(o, tp, lang, origin), lang }));
  const f = q.get("f") ?? "html";
  if (f === "text") return new NextResponse(pages.map((p) => toText(p.lines, cols)).join("\n\n"), { headers: { "content-type": "text/plain; charset=utf-8" } });
  if (f === "escpos") {
    const parts = pages.map((p) => toEscPos(p.lines, cols));
    const all = new Uint8Array(parts.reduce((a, p) => a + p.length, 0));
    let off = 0; for (const p of parts) { all.set(p, off); off += p.length; }
    return new NextResponse(all, { headers: { "content-type": "application/octet-stream" } });
  }
  const qr: Record<string, string> = {};
  for (const p of pages) for (const l of p.lines) if (l.k === "qr") qr[l.data] = await QRCode.toString(l.data, { type: "svg", margin: 0 });
  return new NextResponse(toHtml(pages, qr), { headers: { "content-type": "text/html; charset=utf-8" } });
}
