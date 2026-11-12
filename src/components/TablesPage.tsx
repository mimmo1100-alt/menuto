"use client";

import { useEffect, useState } from "react";
import { pickLang, type Lang } from "@/lib/i18n";
import DashNav from "./DashNav";

type R = { id: string; name: string; slug: string; currency: string };
type Row = { id: string; name: string; code?: string; active: boolean };
type State = { dineIn: boolean; payments: ("cash" | "card_table" | "satispay")[]; tables: Row[] };

const D: Record<Lang, Record<string, string>> = {
  it: {
    title: "Tavoli", intro: "Ogni tavolo ha il suo codice QR. Il cliente lo inquadra, ordina dal telefono e l'ordine arriva con il numero del tavolo.",
    on: "Accetta ordini al tavolo", onHint: "Valgono gli orari di apertura del ristorante.", pay: "Pagamento al tavolo", cash: "Contanti", card_table: "Carta o Bancomat al tavolo", satispay: "Satispay",
    list: "I tuoi tavoli", none: "Nessun tavolo. Aggiungine qualcuno qui sotto.", name: "Nome o numero", active: "Attivo", open: "Apri", remove: "Rimuovi",
    add: "Aggiungi", howMany: "Quanti tavoli?", print: "Stampa i QR (PDF)", printOne: "QR", printHint: "Si apre un foglio A4 con 6 cartellini per pagina: stampalo o scegli «Salva come PDF».",
    saveFirst: "Salva prima le modifiche per stampare.", save: "Salva", saving: "Salvo…", saved: "Salvato", unsaved: "Modifiche non salvate",
    errDup: "Due tavoli hanno lo stesso nome.", errPay: "Scegli almeno un metodo di pagamento al tavolo.", errSvc: "Il ristorante deve avere almeno un servizio attivo (ritiro o consegna) se spegni gli ordini al tavolo.", err: "Non salvato. Controlla i campi.",
    newCode: "Il link del tavolo è segreto: se un QR finisce in giro, rimuovi il tavolo e ricrealo per avere un codice nuovo.",
  },
  en: {
    title: "Tables", intro: "Each table has its own QR code. The customer scans it, orders from their phone and the order arrives with the table number.",
    on: "Take orders at the table", onHint: "The restaurant's opening hours apply.", pay: "Payment at the table", cash: "Cash", card_table: "Card at the table", satispay: "Satispay",
    list: "Your tables", none: "No tables yet. Add some below.", name: "Name or number", active: "Active", open: "Open", remove: "Remove",
    add: "Add", howMany: "How many tables?", print: "Print the QR codes (PDF)", printOne: "QR", printHint: "Opens an A4 sheet with 6 cards per page: print it or choose “Save as PDF”.",
    saveFirst: "Save your changes first to print.", save: "Save", saving: "Saving…", saved: "Saved", unsaved: "Unsaved changes",
    errDup: "Two tables have the same name.", errPay: "Pick at least one payment method at the table.", errSvc: "The restaurant needs at least one other service (pickup or delivery) if you turn off table orders.", err: "Not saved. Check the fields.",
    newCode: "Table links are secret: if a QR gets out, remove the table and add it again to get a new code.",
  },
  ar: {
    title: "الترابيزات", intro: "كل ترابيزة ليها كود QR. الزبون يصوّره ويطلب من موبايله، والطلب يوصلك برقم الترابيزة.",
    on: "استقبل طلبات من الترابيزات", onHint: "بتمشي على مواعيد فتح المطعم.", pay: "الدفع على الترابيزة", cash: "كاش", card_table: "كارت أو بنكومات على الترابيزة", satispay: "Satispay",
    list: "الترابيزات بتاعتك", none: "مفيش ترابيزات لسه. ضيف من تحت.", name: "الاسم أو الرقم", active: "شغالة", open: "افتح", remove: "امسح",
    add: "ضيف", howMany: "كام ترابيزة؟", print: "اطبع أكواد الـ QR (PDF)", printOne: "QR", printHint: "هتفتح صفحة A4 فيها 6 كروت في كل صفحة: اطبعها أو اختار «حفظ كـ PDF».",
    saveFirst: "احفظ التعديلات الأول عشان تطبع.", save: "حفظ", saving: "بيحفظ…", saved: "اتحفظ", unsaved: "فيه تعديلات مش محفوظة",
    errDup: "فيه ترابيزتين بنفس الاسم.", errPay: "اختار طريقة دفع واحدة على الأقل للترابيزات.", errSvc: "المطعم لازم يبقى عنده خدمة تانية شغالة (استلام أو توصيل) لو قفلت طلبات الترابيزات.", err: "ماتحفظش. راجع البيانات.",
    newCode: "لينك كل ترابيزة سري: لو كود اتنشر برّه، امسح الترابيزة وضيفها تاني عشان ياخد كود جديد.",
  },
};

let tmp = 0;
const nextName = (rows: Row[]) => {
  const nums = rows.map((r) => Number(r.name)).filter((n) => Number.isInteger(n) && n > 0);
  return (nums.length ? Math.max(...nums) : 0) + 1;
};

export default function TablesPage({ restaurant, restaurants, origin, initial, isPartner = false }: { restaurant: R; restaurants: R[]; origin: string; initial: State; isPartner?: boolean }) {
  const [lang, setLang] = useState<Lang>("it");
  const [s, setS] = useState<State>(initial);
  const [dirty, setDirty] = useState(false);
  const [howMany, setHowMany] = useState(initial.tables.length ? 1 : 10);
  const [msg, setMsg] = useState<{ text: string; bad?: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const k = (x: string) => D[lang][x] ?? x;
  useEffect(() => { const l = pickLang(navigator.languages, "it"); setLang(l); document.documentElement.lang = l; document.documentElement.dir = l === "ar" ? "rtl" : "ltr"; }, []);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const edit = (f: (d: State) => State) => { setS((cur) => f(cur)); setDirty(true); setMsg(null); };
  const addTables = () => edit((d) => {
    const rows = [...d.tables];
    for (let i = 0; i < Math.min(Math.max(howMany, 1), 100); i++) rows.push({ id: `new-${++tmp}`, name: String(nextName(rows)), active: true });
    return { ...d, tables: rows };
  });

  async function save() {
    setSaving(true); setMsg(null);
    try {
      const res = await fetch(`/api/dashboard/${restaurant.id}/tables`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ dineIn: s.dineIn, payments: s.payments, tables: s.tables.map(({ id, name, active }) => ({ id, name: name.trim(), active })) }) });
      const j = await res.json();
      if (!res.ok) { setMsg({ text: k(j.error === "duplicate_table" ? "errDup" : j.error === "payments" ? "errPay" : j.error === "services" ? "errSvc" : "err"), bad: true }); return; }
      setS(j); setDirty(false); setMsg({ text: k("saved") });
    } catch { setMsg({ text: k("err"), bad: true }); } finally { setSaving(false); }
  }

  const printUrl = (id?: string) => `/dashboard/tables/print?r=${restaurant.id}${id ? `&id=${id}` : ""}`;
  return (
    <>
      <DashNav lang={lang} current="tables" restaurant={restaurant} restaurants={restaurants} isPartner={isPartner} />
      <div className="wrap"><div className="adm">
        <h2 style={{ fontSize: 26 }}>{k("title")}</h2>
        <p className="muted" style={{ margin: 0 }}>{k("intro")}</p>

        <section className="card">
          <label className="check"><input type="checkbox" checked={s.dineIn} onChange={(e) => edit((d) => ({ ...d, dineIn: e.target.checked, payments: e.target.checked && !d.payments.length ? ["cash"] : d.payments }))} /> <b>{k("on")}</b></label>
          <span className="small muted">{k("onHint")}</span>
          {s.dineIn && (
            <div style={{ display: "grid", gap: 6 }}>
              <span className="small">{k("pay")}</span>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {(["cash", "card_table", "satispay"] as const).map((p) => (
                  <label key={p} className="check"><input type="checkbox" checked={s.payments.includes(p)} onChange={(e) => edit((d) => ({ ...d, payments: e.target.checked ? [...d.payments, p] : d.payments.filter((x) => x !== p) }))} /> {k(p)}</label>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="card">
          <h3>{k("list")}</h3>
          {s.tables.length === 0 ? <p className="empty">{k("none")}</p> : (
            <div className="tlist">
              {s.tables.map((t, i) => (
                <div className="trow" key={t.id}>
                  <input type="text" aria-label={k("name")} value={t.name} maxLength={20} onChange={(e) => edit((d) => ({ ...d, tables: d.tables.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) }))} />
                  <label className="check small"><input type="checkbox" checked={t.active} onChange={(e) => edit((d) => ({ ...d, tables: d.tables.map((x, j) => (j === i ? { ...x, active: e.target.checked } : x)) }))} /> {k("active")}</label>
                  <span className="sp" />
                  {t.code && !dirty && <>
                    <a className="link small" href={`${origin}/r/${restaurant.slug}?t=${t.code}`} target="_blank" rel="noreferrer">{k("open")}</a>
                    {t.active && <a className="link small" href={printUrl(t.id)} target="_blank" rel="noreferrer">{k("printOne")}</a>}
                  </>}
                  <button className="link small" onClick={() => edit((d) => ({ ...d, tables: d.tables.filter((_, j) => j !== i) }))}>{k("remove")}</button>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: 8, alignItems: "end", flexWrap: "wrap" }}>
            <label className="f" style={{ width: 140 }}>{k("howMany")}<input type="number" min={1} max={100} value={howMany} onChange={(e) => setHowMany(Number(e.target.value) || 1)} /></label>
            <button className="btn sm ghost" onClick={addTables}>+ {k("add")}</button>
          </div>
          <span className="small muted">{k("newCode")}</span>
        </section>

        <section className="card">
          <div>{dirty || !s.tables.some((t) => t.active)
            ? <button className="btn" disabled>{k("print")}</button>
            : <a className="btn" href={printUrl()} target="_blank" rel="noreferrer">{k("print")}</a>}</div>
          <span className="small muted">{dirty ? k("saveFirst") : k("printHint")}</span>
        </section>
      </div></div>
      <div className="savebar"><div className="wrap">
        {msg ? <span className={msg.bad ? "err" : "small"}>{msg.text}</span> : dirty ? <span className="small muted">{k("unsaved")}</span> : null}
        <button className="btn" disabled={!dirty || saving} onClick={save}>{saving ? k("saving") : k("save")}</button>
      </div></div>
    </>
  );
}
