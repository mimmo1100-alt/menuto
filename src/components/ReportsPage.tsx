"use client";

import { useEffect, useState } from "react";
import { DAYKEYS, LOCALE, money, pickLang, t as ct, tr, type Lang } from "@/lib/i18n";
import { addDaysYmd } from "@/lib/time";
import type { Bucket, SalesReport } from "@/lib/reports";
import DashNav from "./DashNav";

type R = { id: string; name: string; slug: string; currency: string };
type Preset = "today" | "yesterday" | "d7" | "d30" | "month" | "lastMonth" | "custom";

const D: Record<Lang, Record<string, string>> = {
  it: {
    title: "Rapporti", today: "Oggi", yesterday: "Ieri", d7: "Ultimi 7 giorni", d30: "Ultimi 30 giorni", month: "Questo mese", lastMonth: "Mese scorso", custom: "Scegli date",
    from: "Dal", to: "Al", sales: "Vendite", orders: "Ordini", avg: "Scontrino medio", customers: "Clienti", newC: "nuovi", retC: "abituali",
    vsPrev: "rispetto al periodo prima", noPrev: "nessun dato prima", trend: "Andamento delle vendite", perDay: "per giorno", perMonth: "per mese",
    byPayment: "Per metodo di pagamento", byType: "Per tipo di ordine", top: "Prodotti più venduti", item: "Prodotto", qty: "Pezzi",
    hours: "Ore con più ordini", weekdays: "Giorni con più ordini", lost: "Ordini non venduti", missed: "Senza risposta", rejected: "Rifiutati", canceled: "Annullati",
    money: "Dettaglio importi", discount: "Sconti dati", fee: "Costi di consegna incassati", tax: "{name} compresa nelle vendite", itemsSold: "Pezzi venduti",
    csv: "Scarica gli ordini (CSV per Excel)", daily: "Anteprima dell'email di fine giornata", none: "Nessun ordine venduto in questo periodo.", loading: "Carico…", error: "Non riesco a caricare il rapporto. Riprova.",
    note: "Contano gli ordini accettati, pronti e completati, nel giorno in cui sono arrivati. Gli ordini di prova non contano.", share: "di", table: "Tabella",
  },
  en: {
    title: "Reports", today: "Today", yesterday: "Yesterday", d7: "Last 7 days", d30: "Last 30 days", month: "This month", lastMonth: "Last month", custom: "Pick dates",
    from: "From", to: "To", sales: "Sales", orders: "Orders", avg: "Average order", customers: "Customers", newC: "new", retC: "returning",
    vsPrev: "vs the period before", noPrev: "no data before", trend: "Sales trend", perDay: "per day", perMonth: "per month",
    byPayment: "By payment method", byType: "By order type", top: "Best sellers", item: "Item", qty: "Qty",
    hours: "Busiest hours", weekdays: "Busiest days", lost: "Orders not sold", missed: "Not answered", rejected: "Declined", canceled: "Canceled",
    money: "Amounts", discount: "Discounts given", fee: "Delivery fees collected", tax: "{name} included in sales", itemsSold: "Items sold",
    csv: "Download the orders (CSV for Excel)", daily: "Preview the end-of-day email", none: "No sold orders in this period.", loading: "Loading…", error: "Couldn't load the report. Try again.",
    note: "Counts accepted, ready and completed orders, on the day they came in. Test orders don't count.", share: "of", table: "Table",
  },
  ar: {
    title: "التقارير", today: "النهارده", yesterday: "امبارح", d7: "آخر 7 أيام", d30: "آخر 30 يوم", month: "الشهر ده", lastMonth: "الشهر اللي فات", custom: "اختار التواريخ",
    from: "من", to: "إلى", sales: "المبيعات", orders: "الطلبات", avg: "متوسط الطلب", customers: "العملاء", newC: "جداد", retC: "متكررين",
    vsPrev: "مقارنة بالفترة اللي قبلها", noPrev: "مفيش بيانات قبلها", trend: "حركة المبيعات", perDay: "باليوم", perMonth: "بالشهر",
    byPayment: "حسب طريقة الدفع", byType: "حسب نوع الطلب", top: "الأكتر مبيعًا", item: "الصنف", qty: "العدد",
    hours: "أكتر ساعات فيها طلبات", weekdays: "أكتر أيام فيها طلبات", lost: "طلبات ماتباعتش", missed: "ماحدش رد", rejected: "مرفوضة", canceled: "ملغية",
    money: "تفاصيل المبالغ", discount: "خصومات", fee: "رسوم توصيل اتحصّلت", tax: "{name} داخلة في المبيعات", itemsSold: "قطع اتباعت",
    csv: "نزّل الطلبات (CSV لإكسل)", daily: "شوف شكل إيميل آخر اليوم", none: "مفيش طلبات اتباعت في الفترة دي.", loading: "بيحمّل…", error: "مش قادر أحمّل التقرير. حاول تاني.",
    note: "بنحسب الطلبات المقبولة والجاهزة والمكتملة، في اليوم اللي وصلت فيه. طلبات التجربة مش محسوبة.", share: "من", table: "جدول",
  },
};

function presetRange(p: Preset, today: string): [string, string] {
  switch (p) {
    case "today": return [today, today];
    case "yesterday": { const y = addDaysYmd(today, -1); return [y, y]; }
    case "d7": return [addDaysYmd(today, -6), today];
    case "d30": return [addDaysYmd(today, -29), today];
    case "month": return [`${today.slice(0, 8)}01`, today];
    case "lastMonth": { const end = addDaysYmd(`${today.slice(0, 8)}01`, -1); return [`${end.slice(0, 8)}01`, end]; }
    default: return [addDaysYmd(today, -6), today];
  }
}

function pct(cur: number, prev: number) {
  if (!prev) return null;
  return Math.round(((cur - prev) / prev) * 100);
}

export default function ReportsPage({ restaurant, restaurants, today, isPartner = false }: { restaurant: R; restaurants: R[]; today: string; isPartner?: boolean }) {
  const [lang, setLang] = useState<Lang>("it");
  const [preset, setPreset] = useState<Preset>("d7");
  const [range, setRange] = useState<[string, string]>(() => presetRange("d7", today));
  const [data, setData] = useState<SalesReport | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const k = (s: string, v: Record<string, string> = {}) => Object.entries(v).reduce((x, [a, b]) => x.replace(`{${a}}`, b), D[lang][s] ?? s);
  const m = (c: number) => money(c, lang, restaurant.currency);

  useEffect(() => { const l = pickLang(navigator.languages, "it"); setLang(l); document.documentElement.lang = l; document.documentElement.dir = l === "ar" ? "rtl" : "ltr"; }, []);
  useEffect(() => {
    const [from, to] = range;
    if (!from || !to || from > to) return;
    const ctl = new AbortController();
    setState("loading");
    fetch(`/api/dashboard/${restaurant.id}/reports?from=${from}&to=${to}`, { signal: ctl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: SalesReport) => { setData(d); setState("ok"); })
      .catch((e) => { if (e?.name !== "AbortError") setState("error"); });
    return () => ctl.abort();
  }, [range, restaurant.id]);

  const choose = (p: Preset) => { setPreset(p); if (p !== "custom") setRange(presetRange(p, today)); };
  const dateFmt = (ymd: string, opts: Intl.DateTimeFormatOptions) => new Date(`${ymd}T12:00:00Z`).toLocaleDateString(LOCALE[lang], { timeZone: "UTC", ...opts });
  const seriesLabel = (key: string, long = false) => data?.grain === "month"
    ? dateFmt(`${key}-01`, { month: long ? "long" : "short", year: long ? "numeric" : "2-digit" })
    : dateFmt(key, long ? { weekday: "long", day: "numeric", month: "long" } : { day: "numeric", month: "short" });

  return (
    <>
      <DashNav lang={lang} current="reports" restaurant={restaurant} restaurants={restaurants} isPartner={isPartner} />
      <div className="wrap"><div className="adm rep">
        <h2 style={{ fontSize: 26 }}>{k("title")}</h2>

        <div className="rep-filters">
          <div className="tabs" role="group" aria-label={k("title")}>
            {(["today", "yesterday", "d7", "d30", "month", "lastMonth", "custom"] as const).map((p) => (
              <button key={p} aria-pressed={preset === p} onClick={() => choose(p)}>{k(p)}</button>
            ))}
          </div>
          {preset === "custom" && (
            <div className="rep-dates">
              <label className="f">{k("from")} <input type="date" value={range[0]} max={range[1] || today} onChange={(e) => setRange([e.target.value, range[1]])} /></label>
              <label className="f">{k("to")} <input type="date" value={range[1]} min={range[0]} max={today} onChange={(e) => setRange([range[0], e.target.value])} /></label>
            </div>
          )}
        </div>

        {state === "error" && <p className="empty">{k("error")}</p>}
        {state === "loading" && !data && <p className="empty">{k("loading")}</p>}

        {data && (
          <div className="rep-body" aria-busy={state === "loading"} style={{ opacity: state === "loading" ? 0.6 : 1 }}>
            <div className="rep-kpis">
              <Kpi label={k("sales")} value={m(data.sold.sales)} delta={pct(data.sold.sales, data.prev.sales)} k={k} />
              <Kpi label={k("orders")} value={String(data.sold.orders)} delta={pct(data.sold.orders, data.prev.orders)} k={k} />
              <Kpi label={k("avg")} value={m(data.sold.avg)} />
              <Kpi label={k("customers")} value={String(data.customers.total)} sub={`${data.customers.new} ${k("newC")} · ${data.customers.returning} ${k("retC")}`} />
            </div>

            {data.sold.orders === 0 ? <p className="empty">{k("none")}</p> : (
              <>
                {data.days > 1 && (
                  <section className="card">
                    <h3>{k("trend")} <span className="muted small">· {k(data.grain === "month" ? "perMonth" : "perDay")}</span></h3>
                    <BarChart rows={data.series} label={(b) => seriesLabel(b.key)} tip={(b) => `${seriesLabel(b.key, true)}: ${m(b.sales)} · ${b.orders} ${k("orders").toLowerCase()}`} value={(b) => b.sales} fmt={m} />
                    <details><summary className="small muted">{k("table")}</summary>
                      <table className="ptable"><thead><tr><th>{k(data.grain === "month" ? "perMonth" : "perDay")}</th><th>{k("orders")}</th><th>{k("sales")}</th></tr></thead>
                        <tbody>{data.series.map((b) => <tr key={b.key}><td>{seriesLabel(b.key, true)}</td><td>{b.orders}</td><td>{m(b.sales)}</td></tr>)}</tbody></table>
                    </details>
                  </section>
                )}

                <div className="rep-two">
                  <section className="card"><h3>{k("byPayment")}</h3><Shares rows={data.byPayment} total={data.sold.sales} name={(key) => ct(lang, key)} m={m} k={k} /></section>
                  <section className="card"><h3>{k("byType")}</h3><Shares rows={data.byType} total={data.sold.sales} name={(key) => ct(lang, key)} m={m} k={k} /></section>
                </div>

                <section className="card"><h3>{k("top")}</h3>
                  <table className="ptable">
                    <thead><tr><th>#</th><th>{k("item")}</th><th>{k("qty")}</th><th>{k("sales")}</th></tr></thead>
                    <tbody>{data.topItems.map((it, i) => <tr key={it.key}><td className="muted">{i + 1}</td><td>{tr(it.name, lang)}</td><td>{it.qty}</td><td>{m(it.sales)}</td></tr>)}</tbody>
                  </table>
                </section>

                <div className="rep-two">
                  <section className="card"><h3>{k("hours")}</h3>
                    <BarChart rows={trimHours(data.byHour)} label={(b) => `${b.key}`} tip={(b) => `${b.key.padStart(2, "0")}:00–${b.key.padStart(2, "0")}:59: ${b.orders} ${k("orders").toLowerCase()} · ${m(b.sales)}`} value={(b) => b.orders} fmt={(n) => String(n)} small />
                  </section>
                  <section className="card"><h3>{k("weekdays")}</h3>
                    <BarChart rows={[1, 2, 3, 4, 5, 6, 0].map((d) => data.byWeekday[d])} label={(b) => ct(lang, DAYKEYS[Number(b.key)])} tip={(b) => `${ct(lang, DAYKEYS[Number(b.key)])}: ${b.orders} ${k("orders").toLowerCase()} · ${m(b.sales)}`} value={(b) => b.orders} fmt={(n) => String(n)} small />
                  </section>
                </div>
              </>
            )}

            <div className="rep-two">
              <section className="card"><h3>{k("lost")}</h3>
                <table className="ptable"><tbody>
                  {(["missed", "rejected", "canceled"] as const).map((s) => <tr key={s}><td>{k(s)}</td><td>{data.lost[s].orders}</td><td>{m(data.lost[s].sales)}</td></tr>)}
                </tbody></table>
              </section>
              <section className="card"><h3>{k("money")}</h3>
                <table className="ptable"><tbody>
                  <tr><td>{k("itemsSold")}</td><td>{data.sold.items}</td></tr>
                  <tr><td>{k("discount")}</td><td>{m(data.sold.discount)}</td></tr>
                  <tr><td>{k("fee")}</td><td>{m(data.sold.deliveryFee)}</td></tr>
                  <tr><td>{k("tax", { name: data.taxName })}</td><td>{m(data.sold.tax)}</td></tr>
                </tbody></table>
              </section>
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <a className="btn sm ghost" href={`/api/dashboard/${restaurant.id}/reports?from=${data.from}&to=${data.to}&format=csv`}>{k("csv")}</a>
              <a className="btn sm ghost" target="_blank" rel="noreferrer" href={`/api/dashboard/${restaurant.id}/reports/daily?date=${data.to === today ? addDaysYmd(today, -1) : data.to}`}>{k("daily")}</a>
            </div>
            <p className="small muted" style={{ margin: 0 }}>{k("note")}</p>
          </div>
        )}
      </div></div>
    </>
  );
}

/** Hours from the first to the last one with orders, so a restaurant open 12–23 doesn't show 24 bars. */
function trimHours(rows: Bucket[]) {
  const used = rows.filter((b) => b.orders > 0).map((b) => Number(b.key));
  if (!used.length) return rows.slice(11, 23);
  return rows.slice(Math.min(...used), Math.max(...used) + 1);
}

function Kpi({ label, value, delta, sub, k }: { label: string; value: string; delta?: number | null; sub?: string; k?: (s: string) => string }) {
  return (
    <div className="card rep-kpi">
      <span className="small muted">{label}</span>
      <b>{value}</b>
      {delta !== undefined && k && (
        <span className="small" style={{ color: delta == null ? "var(--muted)" : delta >= 0 ? "var(--ok)" : "var(--danger)" }}>
          {delta == null ? k("noPrev") : `${delta >= 0 ? "▲ +" : "▼ "}${delta}% ${k("vsPrev")}`}
        </span>
      )}
      {sub && <span className="small muted">{sub}</span>}
    </div>
  );
}

function Shares({ rows, total, name, m, k }: { rows: Bucket[]; total: number; name: (k: string) => string; m: (c: number) => string; k: (s: string) => string }) {
  return (
    <div className="rep-shares">
      {rows.map((b) => {
        const p = total ? Math.round((b.sales / total) * 100) : 0;
        return (
          <div key={b.key} className="rep-share">
            <div className="rep-share-h"><span>{name(b.key)}</span><b>{m(b.sales)}</b></div>
            <div className="rep-track" aria-hidden="true"><div style={{ width: `${Math.max(p, 1)}%` }} /></div>
            <span className="small muted">{b.orders} {k("orders").toLowerCase()} · {p}%</span>
          </div>
        );
      })}
    </div>
  );
}

function BarChart({ rows, label, tip, value, fmt, small = false }: { rows: Bucket[]; label: (b: Bucket) => string; tip: (b: Bucket) => string; value: (b: Bucket) => number; fmt: (n: number) => string; small?: boolean }) {
  const [hover, setHover] = useState<number | null>(null);
  const H = small ? 120 : 180, W = 600, padTop = 18, padBottom = 22;
  const max = Math.max(1, ...rows.map(value));
  const n = rows.length;
  const slot = W / Math.max(n, 1);
  const bw = Math.max(2, Math.min(36, slot - 2));
  const every = Math.ceil(n / (small ? 12 : 10));
  const peak = rows.reduce((bi, b, i) => (value(b) > value(rows[bi]) ? i : bi), 0);
  const y = (v: number) => padTop + (H - padTop - padBottom) * (1 - v / max);
  const base = H - padBottom;
  return (
    <div className="rep-chart" dir="ltr" onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={rows.map(tip).join("; ")} preserveAspectRatio="none" style={{ height: H }}>
        <line x1="0" x2={W} y1={base} y2={base} stroke="var(--line)" strokeWidth="1" />
        {rows.map((b, i) => {
          const v = value(b), x = i * slot + (slot - bw) / 2, top = y(v), h = base - top;
          const r = Math.min(4, bw / 2, h);
          return (
            <g key={b.key} onMouseEnter={() => setHover(i)} onClick={() => setHover(i)}>
              <rect x={i * slot} y={0} width={slot} height={H} fill="transparent" />
              {v > 0 && <path d={`M${x},${base} V${top + r} Q${x},${top} ${x + r},${top} H${x + bw - r} Q${x + bw},${top} ${x + bw},${top + r} V${base} Z`} fill="var(--accent)" opacity={hover == null || hover === i ? 1 : 0.45} />}
            </g>
          );
        })}
      </svg>
      {n > 1 && value(rows[peak]) > 0 && (
        <span className="rep-peak" style={{ left: `${((peak + 0.5) / n) * 100}%`, top: y(value(rows[peak])) - 16 }}>{fmt(value(rows[peak]))}</span>
      )}
      <div className="rep-axis" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }} aria-hidden="true">
        {rows.map((b, i) => <span key={b.key}>{i % every === 0 ? label(b) : ""}</span>)}
      </div>
      {hover != null && rows[hover] && (
        <div className="rep-tip" dir="auto" style={{ left: `${Math.min(85, Math.max(15, ((hover + 0.5) / n) * 100))}%` }}>{tip(rows[hover])}</div>
      )}
    </div>
  );
}
