"use client";

import { useEffect, useState } from "react";
import { LOCALE, money, pickLang, t as ct, type Lang } from "@/lib/i18n";
import DashNav from "./DashNav";

type Rest = {
  id: string; name: string; slug: string; city: string; isDemo: boolean; accepting: boolean; currency: string; owners: string[];
  orders7: number; sales7: number; missed7: number; lastOrderAt: string | null;
};
type Overview = { partner: { name: string; imprint: string }; restaurants: Rest[] };
type O = { id: string; number: number; status: string; type: string; total: number; payment: string; createdAt: string; firstName: string; lastName: string; restaurant: { name: string; currency: string } };

const D: Record<Lang, Record<string, string>> = {
  it: {
    title: "I tuoi ristoranti", launch: "Pronti per partire? Controlla cosa manca", last7: "Ultimi 7 giorni", orders: "Ordini", sales: "Vendite", missed: "Persi", lastOrder: "Ultimo ordine", never: "Mai",
    manage: "Gestisci", menuPage: "Menu", off: "Ordini online spenti", demo: "Demo", total: "Totale",
    add: "Aggiungi ristorante", name: "Nome", phone: "Telefono", address: "Indirizzo", city: "Città", ownerEmail: "Email del titolare (facoltativa)", ownerPass: "Password del titolare (almeno 8 caratteri)",
    create: "Crea ristorante", created: "Ristorante creato", emailTaken: "Questa email ha già un account.", needPass: "Serve una password per il titolare.", err: "Controlla i campi e riprova.",
    allOrders: "Tutti gli ordini", status: "Stato", type: "Tipo", all: "Tutti", days: "Periodo", d7: "7 giorni", d30: "30 giorni", d90: "90 giorni", export: "Scarica CSV (Excel)", none: "Nessun ordine in questo periodo.",
    restaurant: "Ristorante", customer: "Cliente", date: "Data",
    branding: "Il tuo marchio", company: "Nome dell'azienda", imprint: "Scritta sotto il menu", imprintHint: "Appare in fondo alla pagina d'ordine di tutti i tuoi ristoranti.", save: "Salva", saved: "Salvato",
  },
  en: {
    title: "Your restaurants", launch: "Ready to go live? See what's missing", last7: "Last 7 days", orders: "Orders", sales: "Sales", missed: "Missed", lastOrder: "Last order", never: "Never",
    manage: "Manage", menuPage: "Menu", off: "Online ordering off", demo: "Demo", total: "Total",
    add: "Add restaurant", name: "Name", phone: "Phone", address: "Address", city: "Town", ownerEmail: "Owner's email (optional)", ownerPass: "Owner's password (at least 8 characters)",
    create: "Create restaurant", created: "Restaurant created", emailTaken: "This email already has an account.", needPass: "The owner needs a password.", err: "Check the fields and try again.",
    allOrders: "All orders", status: "Status", type: "Type", all: "All", days: "Period", d7: "7 days", d30: "30 days", d90: "90 days", export: "Download CSV (Excel)", none: "No orders in this period.",
    restaurant: "Restaurant", customer: "Customer", date: "Date",
    branding: "Your brand", company: "Company name", imprint: "Line under the menu", imprintHint: "Shown at the bottom of every restaurant's ordering page.", save: "Save", saved: "Saved",
  },
  ar: {
    title: "مطاعمك", launch: "جاهزين نبدأ؟ شوف إيه الناقص", last7: "آخر 7 أيام", orders: "الطلبات", sales: "المبيعات", missed: "فايتة", lastOrder: "آخر طلب", never: "ولا مرة",
    manage: "إدارة", menuPage: "المنيو", off: "الطلبات أونلاين مقفولة", demo: "تجريبي", total: "الإجمالي",
    add: "أضف مطعم", name: "الاسم", phone: "التليفون", address: "العنوان", city: "المدينة", ownerEmail: "إيميل صاحب المطعم (اختياري)", ownerPass: "باسورد صاحب المطعم (8 حروف على الأقل)",
    create: "اعمل المطعم", created: "المطعم اتعمل", emailTaken: "الإيميل ده عليه حساب بالفعل.", needPass: "صاحب المطعم محتاج باسورد.", err: "راجع الخانات وجرب تاني.",
    allOrders: "كل الطلبات", status: "الحالة", type: "النوع", all: "الكل", days: "الفترة", d7: "7 أيام", d30: "30 يوم", d90: "90 يوم", export: "نزّل CSV (إكسل)", none: "مفيش طلبات في الفترة دي.",
    restaurant: "المطعم", customer: "العميل", date: "التاريخ",
    branding: "علامتك التجارية", company: "اسم الشركة", imprint: "السطر اللي تحت المنيو", imprintHint: "بيظهر تحت صفحة الطلب في كل مطاعمك.", save: "حفظ", saved: "اتحفظ",
  },
};

export default function PartnerPanel({ initial }: { initial: Overview }) {
  const [lang, setLang] = useState<Lang>("it");
  const [data] = useState(initial);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [filters, setFilters] = useState({ status: "", type: "", days: "30", r: "" });
  const [orders, setOrders] = useState<O[] | null>(null);
  const [brand, setBrand] = useState(initial.partner);
  const [brandMsg, setBrandMsg] = useState("");
  const k = (s: string) => D[lang][s] ?? s;
  const t = (s: string) => ct(lang, s);
  const fmtDate = (iso: string) => new Date(iso).toLocaleString(LOCALE[lang], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  useEffect(() => { const l = pickLang(navigator.languages, "it"); setLang(l); document.documentElement.lang = l; document.documentElement.dir = l === "ar" ? "rtl" : "ltr"; }, []);
  const qs = new URLSearchParams(Object.entries(filters).filter(([, v]) => v)).toString();
  useEffect(() => {
    const ac = new AbortController();
    setOrders(null);
    fetch(`/api/partner/orders?${qs}`, { signal: ac.signal }).then((r) => r.json()).then(setOrders).catch(() => {});
    return () => ac.abort();
  }, [qs]);

  async function addRestaurant(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setMsg("");
    const res = await fetch("/api/partner/restaurants", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))) });
    const j = await res.json();
    setBusy(false);
    if (!res.ok) { setMsg(j.error === "email_taken" ? k("emailTaken") : j.error === "password" ? k("needPass") : k("err")); return; }
    location.href = `/dashboard/settings?r=${j.id}`;
  }
  async function saveBrand() {
    const res = await fetch("/api/partner/branding", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(brand) });
    setBrandMsg(res.ok ? k("saved") : k("err"));
    setTimeout(() => setBrandMsg(""), 2000);
  }

  const totals = data.restaurants.reduce((a, r) => ({ orders: a.orders + r.orders7, sales: a.sales + r.sales7, missed: a.missed + r.missed7 }), { orders: 0, sales: 0, missed: 0 });
  const cur = data.restaurants[0]?.currency ?? "EUR";

  return (
    <>
      <DashNav lang={lang} current="partner" restaurant={null} restaurants={[]} isPartner />
      <div className="wrap"><div className="adm">
        <h2 style={{ fontSize: 26 }}>{k("title")} · {data.partner.name}</h2>
        <div><a className="btn sm" href="/dashboard/partner/launch">✓ {k("launch")}</a></div>

        <section className="card">
          <h3>{k("last7")}</h3>
          <div style={{ overflowX: "auto" }}>
            <table className="ptable num">
              <thead><tr><th>{k("restaurant")}</th><th>{k("orders")}</th><th>{k("sales")}</th><th>{k("missed")}</th><th>{k("lastOrder")}</th><th /></tr></thead>
              <tbody>
                {data.restaurants.map((r) => (
                  <tr key={r.id}>
                    <td><b>{r.name}</b> {r.isDemo && <span className="pill neutral">{k("demo")}</span>} {!r.accepting && <span className="pill bad">{k("off")}</span>}<div className="small muted">{r.city}{r.owners.length ? ` · ${r.owners.join(", ")}` : ""}</div></td>
                    <td>{r.orders7}</td>
                    <td>{money(r.sales7, lang, r.currency)}</td>
                    <td>{r.missed7 > 0 ? <span className="pill bad">{r.missed7}</span> : 0}</td>
                    <td className="small">{r.lastOrderAt ? fmtDate(r.lastOrderAt) : k("never")}</td>
                    <td style={{ whiteSpace: "nowrap" }}><a className="btn sm" href={`/dashboard/orders?r=${r.id}`}>{k("manage")}</a> <a className="btn sm ghost" href={`/r/${r.slug}`} target="_blank" rel="noreferrer">{k("menuPage")}</a></td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr><td><b>{k("total")}</b></td><td><b>{totals.orders}</b></td><td><b>{money(totals.sales, lang, cur)}</b></td><td><b>{totals.missed}</b></td><td /><td /></tr></tfoot>
            </table>
          </div>
        </section>

        <section className="card"><h3>{k("add")}</h3>
          <form className="form" style={{ marginTop: 0 }} onSubmit={addRestaurant}>
            <div className="row2">
              <label className="f" htmlFor="nr-name">{k("name")} *<input type="text" id="nr-name" name="name" required minLength={2} /></label>
              <label className="f" htmlFor="nr-phone">{k("phone")} *<input type="tel" id="nr-phone" name="phone" required /></label>
              <label className="f" htmlFor="nr-address">{k("address")} *<input type="text" id="nr-address" name="address" required /></label>
              <label className="f" htmlFor="nr-city">{k("city")} *<input type="text" id="nr-city" name="city" required /></label>
              <label className="f" htmlFor="nr-email">{k("ownerEmail")}<input type="email" id="nr-email" name="ownerEmail" autoComplete="off" /></label>
              <label className="f" htmlFor="nr-pass">{k("ownerPass")}<input type="password" id="nr-pass" name="ownerPassword" minLength={8} autoComplete="new-password" style={{ width: "100%", border: "1px solid var(--line)", background: "var(--bg)", borderRadius: 10, padding: "10px 12px" }} /></label>
            </div>
            {msg && <p className="err">{msg}</p>}
            <div><button className="btn" disabled={busy}>{k("create")}</button></div>
          </form>
        </section>

        <section className="card"><h3>{k("allOrders")}</h3>
          <div className="hrow">
            <label className="f" htmlFor="po-r">{k("restaurant")}<select id="po-r" value={filters.r} onChange={(e) => setFilters({ ...filters, r: e.target.value })}><option value="">{k("all")}</option>{data.restaurants.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></label>
            <label className="f" htmlFor="po-status">{k("status")}<select id="po-status" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><option value="">{k("all")}</option>{["PENDING", "ACCEPTED", "READY", "COMPLETED", "REJECTED", "MISSED", "CANCELED"].map((s) => <option key={s} value={s}>{t(s)}</option>)}</select></label>
            <label className="f" htmlFor="po-type">{k("type")}<select id="po-type" value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}><option value="">{k("all")}</option>{["PICKUP", "DELIVERY", "DINEIN"].map((s) => <option key={s} value={s}>{t(s)}</option>)}</select></label>
            <label className="f" htmlFor="po-days">{k("days")}<select id="po-days" value={filters.days} onChange={(e) => setFilters({ ...filters, days: e.target.value })}><option value="7">{k("d7")}</option><option value="30">{k("d30")}</option><option value="90">{k("d90")}</option></select></label>
            <a className="btn sm ghost" href={`/api/partner/orders?${qs}&format=csv`}>{k("export")}</a>
          </div>
          {orders === null ? <p className="empty">…</p> : !orders.length ? <p className="empty">{k("none")}</p> : (
            <div style={{ overflowX: "auto" }}>
              <table className="ptable num">
                <thead><tr><th>{k("date")}</th><th>{k("restaurant")}</th><th>#</th><th>{k("status")}</th><th>{k("type")}</th><th>{k("customer")}</th><th>{k("total")}</th></tr></thead>
                <tbody>{orders.slice(0, 200).map((o) => (
                  <tr key={o.id}><td className="small">{fmtDate(o.createdAt)}</td><td>{o.restaurant.name}</td><td>{o.number}</td><td>{t(o.status)}</td><td>{t(o.type)}</td><td>{o.firstName} {o.lastName}</td><td>{money(o.total, lang, o.restaurant.currency)}</td></tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card"><h3>{k("branding")}</h3>
          <div className="row2">
            <label className="f" htmlFor="br-name">{k("company")}<input type="text" id="br-name" value={brand.name} onChange={(e) => setBrand({ ...brand, name: e.target.value })} /></label>
            <label className="f" htmlFor="br-imprint">{k("imprint")}<input type="text" id="br-imprint" maxLength={120} value={brand.imprint} onChange={(e) => setBrand({ ...brand, imprint: e.target.value })} /></label>
          </div>
          <p className="small muted" style={{ margin: 0 }}>{k("imprintHint")}</p>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}><button className="btn sm" onClick={saveBrand}>{k("save")}</button><span className="small">{brandMsg}</span></div>
        </section>
      </div></div>
    </>
  );
}
