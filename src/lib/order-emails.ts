import type { Order, OrderItem, Restaurant } from "@prisma/client";
import { db } from "./db";
import { sendMail } from "./email";
import { LOCALE, money, t, tr, type Lang } from "./i18n";

export type EmailKind = "received" | "accepted" | "rejected" | "canceled" | "missed" | "ready" | "new_order";

const COPY: Record<Lang, Record<string, string>> = {
  it: {
    received: "Abbiamo ricevuto il tuo ordine", receivedSub: "Il ristorante lo sta guardando. Ti scriviamo appena lo conferma.",
    accepted: "Ordine confermato", acceptedSub: "Pronto per le {time}.",
    rejected: "Il ristorante non può accettare il tuo ordine", canceled: "Il tuo ordine è stato annullato",
    missed: "Il ristorante non ha risposto in tempo", missedSub: "Il tuo ordine non è stato preso in carico e non ti verrà addebitato nulla. Puoi riprovare.",
    ready: "Il tuo ordine è pronto", reason: "Motivo", track: "Segui il tuo ordine", retry: "Riprova",
    new_order: "Nuovo ordine #{n}", new_orderSub: "Aprilo nell'app ordini per accettarlo.", openOrders: "Apri gli ordini",
    order: "Ordine", when: "Orario", customer: "Cliente", address: "Indirizzo", questions: "Domande sul tuo ordine? Chiama",
  },
  en: {
    received: "We received your order", receivedSub: "The restaurant is looking at it. We'll email you as soon as they confirm.",
    accepted: "Order confirmed", acceptedSub: "Ready at {time}.",
    rejected: "The restaurant can't accept your order", canceled: "Your order was canceled",
    missed: "The restaurant didn't answer in time", missedSub: "Your order wasn't taken and you won't be charged. You can try again.",
    ready: "Your order is ready", reason: "Reason", track: "Track your order", retry: "Try again",
    new_order: "New order #{n}", new_orderSub: "Open it in the orders app to accept it.", openOrders: "Open orders",
    order: "Order", when: "Time", customer: "Customer", address: "Address", questions: "Questions about your order? Call",
  },
  ar: {
    received: "استلمنا طلبك", receivedSub: "المطعم بيراجعه دلوقتي. هنبعتلك أول ما يأكده.",
    accepted: "تم تأكيد الطلب", acceptedSub: "جاهز الساعة {time}.",
    rejected: "المطعم مش هيقدر يقبل طلبك", canceled: "تم إلغاء طلبك",
    missed: "المطعم ماردش في الوقت", missedSub: "طلبك ماتسجلش ومش هيتحسب عليك حاجة. تقدر تحاول تاني.",
    ready: "طلبك جاهز", reason: "السبب", track: "تابع طلبك", retry: "حاول تاني",
    new_order: "طلب جديد #{n}", new_orderSub: "افتحه في تطبيق الطلبات عشان تقبله.", openOrders: "افتح الطلبات",
    order: "طلب", when: "الوقت", customer: "العميل", address: "العنوان", questions: "عندك سؤال عن طلبك؟ كلّم",
  },
};

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const baseUrl = () => (process.env.PUBLIC_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")).replace(/\/$/, "");

type Full = Order & { items: OrderItem[]; restaurant: Restaurant };

function render(o: Full, kind: EmailKind, lang: Lang) {
  const c = (k: string, v: Record<string, string | number> = {}) => Object.entries(v).reduce((s, [a, b]) => s.replace(`{${a}}`, String(b)), COPY[lang][k] ?? COPY.en[k] ?? k);
  const r = o.restaurant;
  const tz = r.timezone;
  const fmt = (d: Date) => d.toLocaleString(LOCALE[lang], { timeZone: tz, weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const m = (x: number) => money(x, lang, r.currency);
  const dir = lang === "ar" ? "rtl" : "ltr";
  const align = lang === "ar" ? "right" : "left";
  const opp = lang === "ar" ? "left" : "right";

  let title = c(kind, { n: o.number });
  let sub = "";
  if (kind === "received") sub = c("receivedSub");
  if (kind === "accepted" && o.readyAt) sub = c("acceptedSub", { time: fmt(o.readyAt) });
  if ((kind === "rejected" || kind === "canceled") && o.rejectReason) sub = `${c("reason")}: ${t(lang, o.rejectReason)}`;
  if (kind === "missed") sub = c("missedSub");
  if (kind === "new_order") { sub = c("new_orderSub"); title = c("new_order", { n: o.number }); }

  const url = kind === "new_order" ? `${baseUrl()}/dashboard/orders?r=${r.id}`
    : kind === "missed" || kind === "rejected" ? `${baseUrl()}/r/${r.slug}?retry=1`
    : `${baseUrl()}/r/${r.slug}/o/${o.id}`;
  const cta = kind === "new_order" ? c("openOrders") : kind === "missed" || kind === "rejected" ? c("retry") : c("track");

  const rows = o.items.map((it) => {
    const opts = [it.sizeName ? tr(it.sizeName, lang) : "", ...((it.options as { name: Record<string, string> }[]) ?? []).map((x) => tr(x.name, lang))].filter(Boolean).join(", ");
    return `<tr><td style="padding:6px 0;vertical-align:top;width:32px"><b>${it.qty}×</b></td><td style="padding:6px 0">${esc(tr(it.name, lang))}${opts ? `<div style="color:#5d6455;font-size:13px">${esc(opts)}</div>` : ""}${it.instructions ? `<div style="font-size:13px"><i>“${esc(it.instructions)}”</i></div>` : ""}</td><td style="padding:6px 0;text-align:${opp};white-space:nowrap">${m(it.total)}</td></tr>`;
  }).join("");
  const line = (label: string, value: string, bold = false) => `<tr><td colspan="2" style="padding:3px 0;${bold ? "font-weight:700;font-size:17px" : ""}">${esc(label)}</td><td style="padding:3px 0;text-align:${opp};${bold ? "font-weight:700;font-size:17px" : ""}">${value}</td></tr>`;
  const addr = o.address as { street?: string; city?: string; more?: string } | null;
  const when = o.asap ? t(lang, "asap") : o.fulfillAt ? fmt(o.fulfillAt) : "";

  const html = `<!doctype html><html lang="${lang}" dir="${dir}"><body style="margin:0;background:#f5f5ef;font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:#1c2017">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5ef"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:12px;text-align:${align}" dir="${dir}">
<tr><td style="padding:24px 24px 8px;color:#5d6455;font-size:14px">${esc(r.name)}</td></tr>
<tr><td style="padding:0 24px"><h1 style="margin:0 0 6px;font-size:24px">${esc(title)}</h1>${sub ? `<p style="margin:0 0 12px;color:#5d6455">${esc(sub)}</p>` : ""}</td></tr>
<tr><td style="padding:8px 24px"><a href="${url}" style="display:inline-block;background:#c4381f;color:#fff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:999px">${esc(cta)}</a></td></tr>
<tr><td style="padding:16px 24px 0;font-size:14px">${esc(c("order"))} <b>#${o.number}</b> · ${esc(t(lang, o.type))} · ${esc(c("when"))}: ${esc(when)} · ${esc(t(lang, o.payment))}</td></tr>
${kind === "new_order" ? `<tr><td style="padding:6px 24px 0;font-size:14px">${esc(c("customer"))}: <b>${esc(o.firstName)} ${esc(o.lastName)}</b> · ${esc(o.phone)} · ${esc(o.email)}</td></tr>` : ""}
${addr?.street ? `<tr><td style="padding:6px 24px 0;font-size:14px">${esc(c("address"))}: ${esc(addr.street)}, ${esc(addr.city)}${addr.more ? ` · ${esc(addr.more)}` : ""}</td></tr>` : ""}
${o.comments ? `<tr><td style="padding:8px 24px 0;font-size:14px"><i>“${esc(o.comments)}”</i></td></tr>` : ""}
<tr><td style="padding:12px 24px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #dfe1d6;font-size:15px">${rows}
<tr><td colspan="3" style="border-top:1px solid #dfe1d6;padding-top:6px"></td></tr>
${line(t(lang, "subtotal"), m(o.subtotal))}
${o.discount ? line(`${t(lang, "discount")}${o.couponCode ? ` (${o.couponCode})` : ""}`, `−${m(o.discount)}`) : ""}
${o.type === "DELIVERY" ? line(t(lang, "deliveryFee"), m(o.deliveryFee)) : ""}
${!r.taxIncluded && o.tax ? line(r.taxName, m(o.tax)) : ""}
${line(t(lang, "total"), m(o.total), true)}
${r.taxIncluded && o.tax ? `<tr><td colspan="2" style="color:#5d6455;font-size:13px">${esc(t(lang, "tax", { name: r.taxName }))}</td><td style="color:#5d6455;font-size:13px;text-align:${opp}">${m(o.tax)}</td></tr>` : ""}
</table></td></tr>
${kind !== "new_order" ? `<tr><td style="padding:0 24px 24px;color:#5d6455;font-size:13px">${esc(c("questions"))} ${esc(r.name)}: ${esc(r.phone)} · ${esc(r.address)}, ${esc(r.city)}</td></tr>` : ""}
</table></td></tr></table></body></html>`;
  return { subject: kind === "new_order" ? `${title} · ${r.name}` : `${r.name}: ${title}`, html };
}

/** Sends the email(s) for an order event. Never throws: a mail problem must not break ordering. */
export async function orderEmails(orderId: string, kind: EmailKind) {
  try {
    const o = await db.order.findUnique({ where: { id: orderId }, include: { items: true, restaurant: true } });
    if (!o || o.email.endsWith("@menuto.invalid")) return; // test orders from the app
    if (kind === "new_order") {
      const lang = (o.restaurant.defaultLang as Lang) ?? "it";
      for (const to of o.restaurant.notifyEmails) {
        const { subject, html } = render(o, kind, lang);
        await sendMail({ to, subject, html, kind, orderId, replyTo: o.email });
      }
      return;
    }
    if (kind === "ready" && !o.restaurant.emailOnReady) return;
    const { subject, html } = render(o, kind, (o.lang as Lang) ?? "it");
    await sendMail({ to: o.email, subject, html, kind, orderId, replyTo: o.restaurant.notifyEmails[0] });
  } catch (e) {
    console.error("order email failed", kind, orderId, e);
  }
}
