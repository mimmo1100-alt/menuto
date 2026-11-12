import type { Order, OrderItem, Restaurant } from "@prisma/client";
import { LOCALE, money, t, tr, type Lang } from "./i18n";

/** A receipt as styled lines, rendered to plain text, ESC/POS bytes (thermal printers) or HTML (browser print). */
export type RLine =
  | { k: "text"; text: string; align?: "left" | "center" | "right"; bold?: boolean; size?: 1 | 2 }
  | { k: "pair"; left: string; right: string; bold?: boolean; size?: 1 | 2 }
  | { k: "rule"; char?: string }
  | { k: "feed"; n?: number }
  | { k: "qr"; data: string; caption?: string };

export type Template = "kitchen" | "customer";
type Full = Order & { items: OrderItem[]; restaurant: Restaurant & { partner?: { imprint: string | null } | null } };

const R: Record<Lang, Record<string, string>> = {
  it: { kitchen: "CUCINA", order: "Ordine", placed: "Ricevuto", accepted: "Accettato", for: "Per", asap: "PRIMA POSSIBILE", customer: "Cliente", notes: "Note", qc: "Controllo prima della consegna: tutto nella busta?", paid: "Da pagare", sign: "Firma del cliente", received: "Ho ricevuto l'ordine", orderOnline: "Ordina online", table: "Tavolo", scan: "Inquadra per la mappa" },
  en: { kitchen: "KITCHEN", order: "Order", placed: "Placed", accepted: "Accepted", for: "For", asap: "AS SOON AS POSSIBLE", customer: "Customer", notes: "Notes", qc: "Check before handing over: everything in the bag?", paid: "To pay", sign: "Customer signature", received: "I received the order", orderOnline: "Order online", table: "Table", scan: "Scan for the map" },
  ar: { kitchen: "المطبخ", order: "طلب", placed: "وصل", accepted: "اتقبل", for: "الموعد", asap: "في أقرب وقت", customer: "العميل", notes: "ملاحظات", qc: "راجع قبل التسليم: كل حاجة في الشنطة؟", paid: "المطلوب", sign: "توقيع العميل", received: "استلمت الطلب", orderOnline: "اطلب أونلاين", table: "ترابيزة", scan: "صوّر للخريطة" },
};

export function buildReceipt(o: Full, template: Template, lang: Lang, origin: string): RLine[] {
  const r = o.restaurant;
  const c = (k: string) => R[lang][k] ?? R.it[k];
  const fmt = (d: Date) => d.toLocaleString(LOCALE[lang], { timeZone: r.timezone, day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  const m = (x: number) => money(x, lang, r.currency).replace(/ | /g, " ");
  const when = o.asap ? c("asap") : o.fulfillAt ? fmt(o.fulfillAt) : "";
  const addr = o.address as { street?: string; city?: string; more?: string; lat?: number; lng?: number } | null;
  const L: RLine[] = [];

  if (template === "kitchen") {
    L.push({ k: "text", text: `${c("kitchen")} · ${t(lang, o.type).toUpperCase()}`, align: "center", bold: true });
    L.push({ k: "text", text: `#${o.number}`, align: "center", bold: true, size: 2 });
    L.push({ k: "text", text: `${c("for")}: ${when}`, align: "center", bold: true, size: o.asap ? 1 : 2 });
    if (o.table) L.push({ k: "text", text: `${c("table")} ${o.table}`, align: "center", bold: true, size: 2 });
    L.push({ k: "text", text: `${o.firstName} ${o.lastName}`, align: "center" });
    L.push({ k: "rule" });
    for (const it of o.items) {
      const name = it.internalName || tr(it.name, lang);
      L.push({ k: "text", text: `[ ] ${it.qty} x ${name}${it.sizeName ? ` (${tr(it.sizeName, lang)})` : ""}`, bold: true, size: 2 });
      for (const op of (it.options as { name: Record<string, string> }[]) ?? []) L.push({ k: "text", text: `      + ${tr(op.name, lang)}` });
      if (it.instructions) L.push({ k: "text", text: `      ! ${it.instructions}`, bold: true });
    }
    if (o.comments) { L.push({ k: "rule" }); L.push({ k: "text", text: `${c("notes")}: ${o.comments}`, bold: true }); }
    L.push({ k: "rule" });
    L.push({ k: "text", text: `[ ] ${c("qc")}` });
    L.push({ k: "feed", n: 3 });
    return L;
  }

  // customer receipt
  L.push({ k: "text", text: r.name, align: "center", bold: true, size: 2 });
  L.push({ k: "text", text: `${r.address}, ${r.city}`, align: "center" });
  L.push({ k: "text", text: r.phone, align: "center" });
  L.push({ k: "rule" });
  L.push({ k: "text", text: `${t(lang, o.type).toUpperCase()} · ${when}`, align: "center", bold: true, size: 2 });
  if (o.table) L.push({ k: "text", text: `${c("table")} ${o.table}`, align: "center", bold: true, size: 2 });
  L.push({ k: "text", text: `${t(lang, o.payment)}`, align: "center", bold: true });
  L.push({ k: "rule" });
  L.push({ k: "pair", left: c("order"), right: `#${o.number}`, bold: true });
  L.push({ k: "pair", left: c("placed"), right: fmt(o.createdAt) });
  if (o.acceptedAt) L.push({ k: "pair", left: c("accepted"), right: fmt(o.acceptedAt) });
  L.push({ k: "rule" });
  L.push({ k: "text", text: `${c("customer")}: ${o.firstName} ${o.lastName}`.trim(), bold: true });
  if (o.phone) L.push({ k: "text", text: o.phone });
  if (addr?.street) {
    L.push({ k: "text", text: `${addr.street}, ${addr.city ?? ""}`, bold: true });
    if (addr.more) L.push({ k: "text", text: addr.more });
  }
  if (o.comments) L.push({ k: "text", text: `${c("notes")}: ${o.comments}` });
  L.push({ k: "rule" });
  for (const it of o.items) {
    L.push({ k: "pair", left: `${it.qty} x ${tr(it.name, lang)}`, right: m(it.total), bold: true });
    const parts = [it.sizeName ? tr(it.sizeName, lang) : "", ...((it.options as { name: Record<string, string> }[]) ?? []).map((x) => tr(x.name, lang))].filter(Boolean);
    if (parts.length) L.push({ k: "text", text: `   ${parts.join(", ")}` });
    if (it.instructions) L.push({ k: "text", text: `   "${it.instructions}"` });
  }
  L.push({ k: "rule" });
  L.push({ k: "pair", left: t(lang, "subtotal"), right: m(o.subtotal) });
  if (o.discount) L.push({ k: "pair", left: `${t(lang, "discount")}${o.couponCode ? ` ${o.couponCode}` : ""}`, right: `-${m(o.discount)}` });
  if (o.type === "DELIVERY") L.push({ k: "pair", left: t(lang, "deliveryFee"), right: m(o.deliveryFee) });
  if (!r.taxIncluded && o.tax) L.push({ k: "pair", left: r.taxName, right: m(o.tax) });
  L.push({ k: "pair", left: `${t(lang, "total").toUpperCase()}`, right: m(o.total), bold: true, size: 2 });
  if (r.taxIncluded && o.tax) L.push({ k: "pair", left: t(lang, "tax", { name: r.taxName }), right: m(o.tax) });
  if (addr?.lat != null && addr?.lng != null) {
    L.push({ k: "qr", data: `https://www.google.com/maps/search/?api=1&query=${addr.lat},${addr.lng}`, caption: c("scan") });
  }
  L.push({ k: "rule" });
  L.push({ k: "text", text: `${c("orderOnline")}: ${origin.replace(/^https?:\/\//, "")}/r/${r.slug}`, align: "center" });
  if (r.partner?.imprint) L.push({ k: "text", text: r.partner.imprint, align: "center" });
  L.push({ k: "rule", char: "- " });
  L.push({ k: "text", text: `${c("received")} (#${o.number})` });
  L.push({ k: "feed", n: 2 });
  L.push({ k: "text", text: `${c("sign")}: ______________________` });
  L.push({ k: "feed", n: 3 });
  return L;
}

// ---------- plain text (also the base for ESC/POS) ----------
function wrap(s: string, width: number) {
  const out: string[] = [];
  for (const para of s.split("\n")) {
    const indent = para.match(/^ */)![0];
    let line = indent;
    for (const w of para.split(/\s+/)) {
      if (!w) continue;
      const sep = line.trim() ? " " : "";
      if ((line + sep + w).length > width) { if (line.trim()) out.push(line); line = indent + (w.length > width - indent.length ? w.slice(0, width - indent.length) : w); }
      else line += sep + w;
    }
    out.push(line);
  }
  return out;
}
function pair(l: string, r: string, width: number) {
  const room = width - r.length - 1;
  const left = wrap(l, Math.max(8, room));
  return left.map((x, i) => (i === left.length - 1 ? x + " ".repeat(Math.max(1, width - x.length - r.length)) + r : x));
}

export function toText(lines: RLine[], cols = 42) {
  const out: string[] = [];
  for (const l of lines) {
    if (l.k === "rule") out.push((l.char ?? "-").repeat(cols).slice(0, cols));
    else if (l.k === "feed") for (let i = 0; i < (l.n ?? 1); i++) out.push("");
    else if (l.k === "qr") out.push(`[QR] ${l.caption ?? ""}`);
    else if (l.k === "pair") out.push(...pair(l.left, l.right, l.size === 2 ? Math.floor(cols / 2) : cols));
    else {
      const w = l.size === 2 ? Math.floor(cols / 2) : cols;
      for (const x of wrap(l.text, w)) out.push(l.align === "center" ? " ".repeat(Math.max(0, Math.floor((w - x.length) / 2))) + x : l.align === "right" ? x.padStart(w) : x);
    }
  }
  return out.join("\n");
}

// ---------- ESC/POS (Epson TM series and compatibles) ----------
// Code page 858 (Latin-1 + €). Characters the printer can't show become "?".
const CP858: Record<string, number> = { "€": 0xd5, "à": 0x85, "è": 0x8a, "é": 0x82, "ì": 0x8d, "ò": 0x95, "ù": 0x97, "À": 0xb7, "È": 0xd4, "É": 0x90, "Ì": 0xde, "Ò": 0xe3, "Ù": 0xeb, "ç": 0x87, "ñ": 0xa4, "ä": 0x84, "ö": 0x94, "ü": 0x81, "°": 0xf8, "·": 0xfa, "’": 0x27, "“": 0x22, "”": 0x22, "–": 0x2d };
function enc(s: string) {
  const b: number[] = [];
  for (const ch of s) {
    const code = ch.charCodeAt(0);
    b.push(code < 0x80 ? code : CP858[ch] ?? 0x3f);
  }
  return b;
}

export function toEscPos(lines: RLine[], cols = 42): Uint8Array {
  const ESC = 0x1b, GS = 0x1d;
  const b: number[] = [ESC, 0x40, ESC, 0x74, 19];
  const style = (bold: boolean, size: 1 | 2, align: "left" | "center" | "right") => {
    b.push(ESC, 0x61, align === "center" ? 1 : align === "right" ? 2 : 0, ESC, 0x45, bold ? 1 : 0, GS, 0x21, size === 2 ? 0x11 : 0x00);
  };
  for (const l of lines) {
    if (l.k === "feed") { b.push(ESC, 0x64, l.n ?? 1); continue; }
    if (l.k === "rule") { style(false, 1, "left"); b.push(...enc((l.char ?? "-").repeat(cols).slice(0, cols)), 0x0a); continue; }
    if (l.k === "qr") {
      const data = enc(l.data); const len = data.length + 3;
      style(false, 1, "center");
      b.push(GS, 0x28, 0x6b, 4, 0, 0x31, 0x41, 0x32, 0x00); // model 2
      b.push(GS, 0x28, 0x6b, 3, 0, 0x31, 0x43, 6); // module size
      b.push(GS, 0x28, 0x6b, 3, 0, 0x31, 0x45, 0x31); // error correction M
      b.push(GS, 0x28, 0x6b, len & 0xff, len >> 8, 0x31, 0x50, 0x30, ...data);
      b.push(GS, 0x28, 0x6b, 3, 0, 0x31, 0x51, 0x30, 0x0a);
      if (l.caption) b.push(...enc(l.caption), 0x0a);
      continue;
    }
    const size = l.size ?? 1;
    const width = size === 2 ? Math.floor(cols / 2) : cols;
    if (l.k === "pair") { style(!!l.bold, size, "left"); for (const x of pair(l.left, l.right, width)) b.push(...enc(x), 0x0a); continue; }
    style(!!l.bold, size, l.align ?? "left");
    for (const x of wrap(l.text, width)) b.push(...enc(x), 0x0a);
  }
  b.push(GS, 0x21, 0, ESC, 0x45, 0, ESC, 0x61, 0, GS, 0x56, 0x42, 0); // reset style, feed and cut
  return Uint8Array.from(b);
}

// ---------- HTML (browser print, 80 mm paper) ----------
const escH = (s: string) => s.replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]!);
export function toHtml(pages: { lines: RLine[]; lang: Lang }[], qrSvgs: Record<string, string> = {}) {
  const body = pages.map(({ lines, lang }) => {
    const dir = lang === "ar" ? "rtl" : "ltr";
    const rows = lines.map((l) => {
      if (l.k === "rule") return `<hr>`;
      if (l.k === "feed") return `<div style="height:${(l.n ?? 1) * 0.6}em"></div>`;
      if (l.k === "qr") return `<div class="c">${qrSvgs[l.data] ?? ""}<div>${escH(l.caption ?? "")}</div></div>`;
      const cls = [l.bold ? "b" : "", l.size === 2 ? "big" : ""].join(" ");
      if (l.k === "pair") return `<div class="p ${cls}"><span>${escH(l.left)}</span><span>${escH(l.right)}</span></div>`;
      return `<div class="${cls} ${l.align === "center" ? "c" : l.align === "right" ? "r" : ""}">${escH(l.text)}</div>`;
    }).join("");
    return `<section dir="${dir}">${rows}</section>`;
  }).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Receipt</title>
<style>@page{size:80mm auto;margin:3mm}body{margin:0;font:13px/1.35 ui-monospace,Menlo,Consolas,monospace;color:#000;background:#fff}
section{width:74mm;margin:0 auto;padding:4mm 0;page-break-after:always}section:last-child{page-break-after:auto}
hr{border:0;border-top:1px dashed #000;margin:4px 0}.b{font-weight:700}.big{font-size:20px}.c{text-align:center}.r{text-align:right}
.p{display:flex;justify-content:space-between;gap:8px}.p span:last-child{white-space:nowrap}svg{width:34mm;height:34mm}</style></head>
<body>${body}<script>window.addEventListener("load",function(){setTimeout(function(){window.print()},150)})</script></body></html>`;
}
