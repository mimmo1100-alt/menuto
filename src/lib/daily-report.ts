import { db } from "./db";
import { sendMail } from "./email";
import { baseUrl, esc } from "./order-emails";
import { LOCALE, money, t, tr, type Lang } from "./i18n";
import { salesReport, type SalesReport } from "./reports";
import { addDaysYmd, localParts } from "./time";

const COPY: Record<Lang, Record<string, string>> = {
  it: { subject: "Vendite di {day}", title: "Com'è andata {day}", sales: "Vendite", orders: "Ordini", avg: "Scontrino medio", vs: "{p}% rispetto a {prev}",
    payment: "Per pagamento", type: "Per tipo", top: "Più venduti", lost: "Non venduti: {n} ordini ({sum})", missed: "senza risposta", rejected: "rifiutati", canceled: "annullati",
    open: "Apri i rapporti", footer: "Ricevi questa email perché sei negli indirizzi degli ordini. Puoi spegnerla in Impostazioni → Email." },
  en: { subject: "Sales for {day}", title: "How {day} went", sales: "Sales", orders: "Orders", avg: "Average order", vs: "{p}% vs {prev}",
    payment: "By payment", type: "By type", top: "Best sellers", lost: "Not sold: {n} orders ({sum})", missed: "not answered", rejected: "declined", canceled: "canceled",
    open: "Open reports", footer: "You get this email because you're on the order emails list. Turn it off in Settings → Emails." },
  ar: { subject: "مبيعات {day}", title: "يوم {day} كان عامل إزاي", sales: "المبيعات", orders: "الطلبات", avg: "متوسط الطلب", vs: "{p}% مقارنة بـ {prev}",
    payment: "حسب الدفع", type: "حسب النوع", top: "الأكتر مبيعًا", lost: "ماتباعتش: {n} طلبات ({sum})", missed: "ماحدش رد", rejected: "مرفوضة", canceled: "ملغية",
    open: "افتح التقارير", footer: "الإيميل ده بيوصلك عشان إيميلك في قائمة إيميلات الطلبات. تقدر تقفله من الإعدادات ← الإيميلات." },
};

type Rest = { id: string; name: string; timezone: string; currency: string; taxName: string; defaultLang: string };

/** The end-of-day email for one local day. The comparison is with the same weekday one week earlier. */
export async function renderDailyReport(r: Rest, ymd: string) {
  const lang = (["it", "en", "ar"].includes(r.defaultLang) ? r.defaultLang : "it") as Lang;
  const c = (k: string, v: Record<string, string | number> = {}) => Object.entries(v).reduce((s, [a, b]) => s.replace(`{${a}}`, String(b)), COPY[lang][k]);
  const [rep, week] = await Promise.all([salesReport(r, ymd, ymd), salesReport(r, addDaysYmd(ymd, -7), addDaysYmd(ymd, -7))]);
  const m = (x: number) => money(x, lang, r.currency);
  const dayName = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString(LOCALE[lang], { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" });
  const day = dayName(ymd);
  const dir = lang === "ar" ? "rtl" : "ltr", align = lang === "ar" ? "right" : "left", opp = lang === "ar" ? "left" : "right";
  const delta = week.sold.sales ? Math.round(((rep.sold.sales - week.sold.sales) / week.sold.sales) * 100) : null;

  const tile = (label: string, value: string) => `<td style="padding:10px;background:#f5f5ef;border-radius:10px;width:33%;vertical-align:top"><div style="color:#5d6455;font-size:12px">${esc(label)}</div><div style="font-size:20px;font-weight:700">${esc(value)}</div></td>`;
  const list = (title: string, rows: { name: string; a: string; b: string }[]) => rows.length ? `<tr><td style="padding:14px 24px 0"><div style="font-weight:700;margin-bottom:4px">${esc(title)}</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">${rows.map((x) => `<tr><td style="padding:4px 0;border-top:1px solid #dfe1d6">${esc(x.name)}</td><td style="padding:4px 8px;border-top:1px solid #dfe1d6;color:#5d6455;text-align:${opp};white-space:nowrap">${esc(x.a)}</td><td style="padding:4px 0;border-top:1px solid #dfe1d6;text-align:${opp};white-space:nowrap">${esc(x.b)}</td></tr>`).join("")}</table></td></tr>` : "";
  const lostN = rep.lost.missed.orders + rep.lost.rejected.orders + rep.lost.canceled.orders;
  const lostSum = rep.lost.missed.sales + rep.lost.rejected.sales + rep.lost.canceled.sales;
  const lostParts = (["missed", "rejected", "canceled"] as const).filter((s) => rep.lost[s].orders).map((s) => `${rep.lost[s].orders} ${c(s)}`).join(", ");

  const html = `<!doctype html><html lang="${lang}" dir="${dir}"><body style="margin:0;background:#f5f5ef;font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:#1c2017">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5ef"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:12px;text-align:${align}" dir="${dir}">
<tr><td style="padding:24px 24px 8px;color:#5d6455;font-size:14px">${esc(r.name)}</td></tr>
<tr><td style="padding:0 24px"><h1 style="margin:0 0 6px;font-size:22px">${esc(c("title", { day }))}</h1>${delta != null ? `<p style="margin:0;color:${delta >= 0 ? "#2c7a3c" : "#b42318"};font-size:14px">${delta >= 0 ? "▲ +" : "▼ "}${esc(c("vs", { p: delta, prev: dayName(addDaysYmd(ymd, -7)) }))}</p>` : ""}</td></tr>
<tr><td style="padding:14px 18px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="6"><tr>${tile(c("sales"), m(rep.sold.sales))}${tile(c("orders"), String(rep.sold.orders))}${tile(c("avg"), m(rep.sold.avg))}</tr></table></td></tr>
${list(c("payment"), rep.byPayment.map((b) => ({ name: t(lang, b.key), a: `${b.orders}×`, b: m(b.sales) })))}
${list(c("type"), rep.byType.map((b) => ({ name: t(lang, b.key), a: `${b.orders}×`, b: m(b.sales) })))}
${list(c("top"), rep.topItems.slice(0, 5).map((it) => ({ name: tr(it.name, lang), a: `${it.qty}×`, b: m(it.sales) })))}
${lostN ? `<tr><td style="padding:14px 24px 0;font-size:14px;color:#b42318">${esc(c("lost", { n: lostN, sum: m(lostSum) }))}${lostParts ? ` · ${esc(lostParts)}` : ""}</td></tr>` : ""}
<tr><td style="padding:18px 24px"><a href="${baseUrl()}/dashboard/reports?r=${r.id}" style="display:inline-block;background:#c4381f;color:#fff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:999px">${esc(c("open"))}</a></td></tr>
<tr><td style="padding:0 24px 24px;color:#5d6455;font-size:12px">${esc(c("footer"))}</td></tr>
</table></td></tr></table></body></html>`;
  return { subject: `${r.name}: ${c("subject", { day })}`, html, report: rep as SalesReport, empty: rep.sold.orders + lostN === 0 };
}

/**
 * Sends yesterday's report (in each restaurant's own time zone) to its order emails. Run once every morning.
 * Each restaurant/day is claimed in DailyReportSent first, so running it twice never sends twice.
 * Days without any order are skipped (closed days stay quiet).
 */
export async function sendDailyReports(now = new Date()) {
  const rs = await db.restaurant.findMany({ where: { dailyReport: true, NOT: { notifyEmails: { isEmpty: true } } }, select: { id: true, name: true, timezone: true, currency: true, taxName: true, defaultLang: true, notifyEmails: true } });
  const out: { restaurant: string; day: string; result: string }[] = [];
  for (const r of rs) {
    const lp = localParts(now, r.timezone);
    // Late-night orders belong to "yesterday": wait until 4:00 local so the day is really over.
    if (lp.minutes < 4 * 60) { out.push({ restaurant: r.name, day: "", result: "too_early" }); continue; }
    const day = addDaysYmd(lp.ymd, -1);
    try {
      const claimed = await db.dailyReportSent.createMany({ data: [{ restaurantId: r.id, ymd: day }], skipDuplicates: true });
      if (!claimed.count) { out.push({ restaurant: r.name, day, result: "already_sent" }); continue; }
      const mail = await renderDailyReport(r, day);
      if (mail.empty) { out.push({ restaurant: r.name, day, result: "no_orders" }); continue; }
      for (const to of r.notifyEmails) await sendMail({ to, subject: mail.subject, html: mail.html, kind: "daily_report" });
      out.push({ restaurant: r.name, day, result: "sent" });
    } catch (e) {
      console.error("daily report failed", r.id, day, e);
      await db.dailyReportSent.deleteMany({ where: { restaurantId: r.id, ymd: day } }).catch(() => {});
      out.push({ restaurant: r.name, day, result: "error" });
    }
  }
  return out;
}
