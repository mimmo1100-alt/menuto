"use client";

import { useEffect, useState } from "react";
import type { SettingsEdit } from "@/lib/settings-edit";
import { pickLang, type Lang } from "@/lib/i18n";
import DashNav from "./DashNav";

type R = { id: string; name: string; slug: string; currency: string };
type Svc = "PICKUP" | "DELIVERY" | "DINEIN";
const SVCS: Svc[] = ["PICKUP", "DELIVERY", "DINEIN"];
const PAYS = ["cash", "card_counter", "card_courier", "card_table"] as const;

const D: Record<Lang, Record<string, string>> = {
  it: {
    title: "Impostazioni", restaurant: "Ristorante", name: "Nome", phone: "Telefono", address: "Indirizzo", city: "Città", postcode: "CAP", defLang: "Lingua predefinita del menu",
    online: "Ordini online", accepting: "Accetta ordini online", pause: "Pausa", pauseNow: "Metti in pausa", pauseFor: "Per", pauseMsg: "Messaggio per i clienti", resume: "Riprendi ordini",
    pausedUntil: "In pausa fino alle", allServices: "Tutti i servizi", m30: "30 minuti", h1: "1 ora", h2: "2 ore", rest: "Resto della giornata",
    services: "Servizi", PICKUP: "Ritiro", DELIVERY: "Consegna", DINEIN: "Al tavolo",
    hours: "Orari di apertura", addHours: "Aggiungi orario", allSvc: "Tutti i servizi", from: "Dalle", to: "Alle", remove: "Elimina",
    special: "Giorni speciali (ferie, festività)", addSpecial: "Aggiungi giorno speciale", spName: "Nome", dateFrom: "Dal", dateTo: "Al", open: "Aperto", closed: "Chiuso", message: "Messaggio",
    scheduled: "Ordini programmati", schedOn: "I clienti possono scegliere un orario", minNotice: "Preavviso minimo (minuti)", maxDays: "Fino a quanti giorni prima", slot: "Intervallo orari (minuti)", hideAsap: "Nascondi “Prima possibile”",
    accept: "Accettazione", autoAccept: "Accetta gli ordini automaticamente", prepPickup: "Tempo di preparazione ritiro (min)", prepDelivery: "Tempo di consegna (min)",
    payments: "Metodi di pagamento", cash: "Contanti", card_counter: "Carta al ritiro", card_courier: "Carta al fattorino", card_table: "Carta al tavolo",
    zones: "Zone di consegna", addZone: "Aggiungi zona", zName: "Nome zona", minOrder: "Ordine minimo €", fee: "Costo consegna €", zPrep: "Tempo (min, facoltativo)", radius: "Raggio (km)", hiddenZ: "Nascosta",
    zoneNote: "La forma delle zone sulla mappa arriverà con l'editor mappa. Per ora i clienti scelgono la zona dall'elenco.",
    coupons: "Codici sconto", addCoupon: "Aggiungi codice", code: "Codice", kind: "Tipo", percent: "Sconto %", fixed: "Sconto fisso €", free_delivery: "Consegna gratis", value: "Valore",
    onePer: "Una volta per cliente", active: "Attivo", validTo: "Valido fino al", used: "Usato",
    tax: "IVA", taxIncl: "I prezzi includono l'IVA", taxName: "Nome imposta", taxRate: "Aliquota %",
    notify: "Email che ricevono gli ordini", addEmail: "Aggiungi email",
    save: "Salva modifiche", discard: "Annulla modifiche", saved: "Salvato", unsaved: "Modifiche non salvate", err: "Salvataggio non riuscito", dupCoupon: "Due codici sconto uguali",
  },
  en: {
    title: "Settings", restaurant: "Restaurant", name: "Name", phone: "Phone", address: "Address", city: "Town", postcode: "Postcode", defLang: "Default menu language",
    online: "Online ordering", accepting: "Accept online orders", pause: "Pause", pauseNow: "Pause orders", pauseFor: "For", pauseMsg: "Message for customers", resume: "Resume orders",
    pausedUntil: "Paused until", allServices: "All services", m30: "30 minutes", h1: "1 hour", h2: "2 hours", rest: "Rest of the day",
    services: "Services", PICKUP: "Pickup", DELIVERY: "Delivery", DINEIN: "At the table",
    hours: "Opening hours", addHours: "Add hours", allSvc: "All services", from: "From", to: "To", remove: "Delete",
    special: "Special days (holidays)", addSpecial: "Add special day", spName: "Name", dateFrom: "From", dateTo: "To", open: "Open", closed: "Closed", message: "Message",
    scheduled: "Scheduled orders", schedOn: "Customers can pick a time", minNotice: "Minimum notice (minutes)", maxDays: "Up to how many days ahead", slot: "Time slot length (minutes)", hideAsap: "Hide “As soon as possible”",
    accept: "Accepting orders", autoAccept: "Accept orders automatically", prepPickup: "Pickup prep time (min)", prepDelivery: "Delivery time (min)",
    payments: "Payment methods", cash: "Cash", card_counter: "Card at pickup", card_courier: "Card to the delivery person", card_table: "Card at the table",
    zones: "Delivery areas", addZone: "Add area", zName: "Area name", minOrder: "Minimum order €", fee: "Delivery fee €", zPrep: "Time (min, optional)", radius: "Radius (km)", hiddenZ: "Hidden",
    zoneNote: "Drawing areas on a map comes with the map editor. For now customers pick their area from the list.",
    coupons: "Coupon codes", addCoupon: "Add code", code: "Code", kind: "Type", percent: "Percent off", fixed: "Fixed amount €", free_delivery: "Free delivery", value: "Value",
    onePer: "Once per customer", active: "Active", validTo: "Valid until", used: "Used",
    tax: "VAT", taxIncl: "Prices include VAT", taxName: "Tax name", taxRate: "Rate %",
    notify: "Emails that receive orders", addEmail: "Add email",
    save: "Save changes", discard: "Discard changes", saved: "Saved", unsaved: "Unsaved changes", err: "Couldn't save", dupCoupon: "Two coupon codes are the same",
  },
  ar: {
    title: "الإعدادات", restaurant: "المطعم", name: "الاسم", phone: "التليفون", address: "العنوان", city: "المدينة", postcode: "الرمز البريدي", defLang: "لغة المنيو الأساسية",
    online: "الطلبات أونلاين", accepting: "استقبال الطلبات أونلاين", pause: "إيقاف مؤقت", pauseNow: "وقّف الطلبات", pauseFor: "لمدة", pauseMsg: "رسالة للعملاء", resume: "رجّع الطلبات",
    pausedUntil: "متوقف لحد", allServices: "كل الخدمات", m30: "نص ساعة", h1: "ساعة", h2: "ساعتين", rest: "باقي اليوم",
    services: "الخدمات", PICKUP: "استلام", DELIVERY: "توصيل", DINEIN: "على الترابيزة",
    hours: "مواعيد العمل", addHours: "أضف مواعيد", allSvc: "كل الخدمات", from: "من", to: "إلى", remove: "حذف",
    special: "أيام خاصة (أجازات)", addSpecial: "أضف يوم خاص", spName: "الاسم", dateFrom: "من يوم", dateTo: "لحد يوم", open: "مفتوح", closed: "مقفول", message: "رسالة",
    scheduled: "الطلب المسبق", schedOn: "العميل يقدر يختار ميعاد", minNotice: "أقل وقت مسبق (دقيقة)", maxDays: "لحد كام يوم قدام", slot: "طول الفترة (دقيقة)", hideAsap: "إخفاء «في أقرب وقت»",
    accept: "قبول الطلبات", autoAccept: "قبول الطلبات تلقائيًا", prepPickup: "وقت تجهيز الاستلام (دقيقة)", prepDelivery: "وقت التوصيل (دقيقة)",
    payments: "طرق الدفع", cash: "كاش", card_counter: "كارت عند الاستلام", card_courier: "كارت مع الطيار", card_table: "كارت على الترابيزة",
    zones: "مناطق التوصيل", addZone: "أضف منطقة", zName: "اسم المنطقة", minOrder: "الحد الأدنى €", fee: "رسوم التوصيل €", zPrep: "الوقت (دقيقة، اختياري)", radius: "نصف القطر (كم)", hiddenZ: "مخفية",
    zoneNote: "رسم المناطق على الخريطة جاي مع محرر الخريطة. دلوقتي العميل بيختار منطقته من القايمة.",
    coupons: "أكواد الخصم", addCoupon: "أضف كود", code: "الكود", kind: "النوع", percent: "خصم %", fixed: "خصم مبلغ €", free_delivery: "توصيل مجاني", value: "القيمة",
    onePer: "مرة واحدة لكل عميل", active: "مفعّل", validTo: "صالح لحد", used: "اتستخدم",
    tax: "الضريبة", taxIncl: "الأسعار شاملة الضريبة", taxName: "اسم الضريبة", taxRate: "النسبة %",
    notify: "إيميلات بتستلم الطلبات", addEmail: "أضف إيميل",
    save: "احفظ التعديلات", discard: "تراجع", saved: "اتحفظ", unsaved: "تعديلات مش محفوظة", err: "الحفظ ماتمّش", dupCoupon: "فيه كودين خصم زي بعض",
  },
};
const DAYS: Record<Lang, string[]> = { it: ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"], en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], ar: ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"] };

const toEuro = (c: number) => (c / 100).toFixed(2);
const toCents = (s: string) => { const n = Number(String(s).replace(",", ".")); return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : 0; };
let seq = 0;
const newId = () => `new_${Date.now().toString(36)}_${seq++}`;

export default function SettingsEditor({ restaurant, restaurants, initial }: { restaurant: R; restaurants: R[]; initial: SettingsEdit & { uses: Record<string, number> } }) {
  const { uses: initialUses, ...init } = initial;
  const [lang, setLang] = useState<Lang>("it");
  const [s, setS] = useState<SettingsEdit>(init);
  const [saved, setSaved] = useState<SettingsEdit>(init);
  const [uses, setUses] = useState(initialUses);
  const [status, setStatus] = useState<"" | "saving" | "saved" | "error">("");
  const [errMsg, setErrMsg] = useState("");
  const [pauseFor, setPauseFor] = useState("60");
  const k = (x: string) => D[lang][x] ?? x;
  const dirty = JSON.stringify(s) !== JSON.stringify(saved);

  useEffect(() => { const l = pickLang(navigator.languages, "it"); setLang(l); document.documentElement.lang = l; document.documentElement.dir = l === "ar" ? "rtl" : "ltr"; }, []);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const edit = (fn: (d: SettingsEdit) => void) => setS((cur) => { const d = structuredClone(cur); fn(d); return d; });

  async function save(next = s) {
    setStatus("saving"); setErrMsg("");
    const res = await fetch(`/api/dashboard/${restaurant.id}/settings`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(next) });
    const j = await res.json();
    if (!res.ok) { setStatus("error"); setErrMsg(j.error === "duplicate_coupon" ? k("dupCoupon") : j.issues?.[0] ? `${j.issues[0].path}: ${j.issues[0].message}` : ""); return; }
    const { uses: u, ...fresh } = j as SettingsEdit & { uses: Record<string, number> };
    setS(fresh); setSaved(fresh); setUses(u); setStatus("saved");
    setTimeout(() => setStatus((x) => (x === "saved" ? "" : x)), 2000);
  }

  // pausing takes effect right away, so it saves immediately (with any other pending edits)
  function pauseNow() {
    let until: Date;
    if (pauseFor === "rest") { until = new Date(); until.setHours(23, 59, 0, 0); } else until = new Date(Date.now() + Number(pauseFor) * 60000);
    const next = structuredClone(s); next.pause.until = until.toISOString(); setS(next); save(next);
  }
  function resume() { const next = structuredClone(s); next.pause.until = null; setS(next); save(next); }

  const num = (v: string, min = 0) => Math.max(min, Number(v) || 0);
  const paused = s.pause.until && new Date(s.pause.until) > new Date();

  return (
    <>
      <DashNav lang={lang} current="settings" restaurant={restaurant} restaurants={restaurants} />
      <div className="wrap"><div className="adm">
        <h2 style={{ fontSize: 26 }}>{k("title")}</h2>

        <section className="card"><h3>{k("online")}</h3>
          <label className="check"><input type="checkbox" checked={s.acceptingOrders} onChange={(e) => edit((d) => { d.acceptingOrders = e.target.checked; })} /> {k("accepting")}</label>
          <div className="hrow" style={{ alignItems: "end" }}>
            {paused ? (
              <>
                <span className="pill bad"><span className="dot" />{k("pausedUntil")} {new Date(s.pause.until!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                <button className="btn sm" onClick={resume}>{k("resume")}</button>
              </>
            ) : (
              <>
                <label className="f" htmlFor="pause-for">{k("pauseFor")}
                  <select id="pause-for" value={pauseFor} onChange={(e) => setPauseFor(e.target.value)}>
                    <option value="30">{k("m30")}</option><option value="60">{k("h1")}</option><option value="120">{k("h2")}</option><option value="rest">{k("rest")}</option>
                  </select>
                </label>
                <div className="choice" style={{ flex: "1 1 300px" }}>
                  {s.services.map((x) => (
                    <label key={x} htmlFor={`ps-${x}`}><input type="checkbox" id={`ps-${x}`} checked={s.pause.services.length === 0 || s.pause.services.includes(x)}
                      onChange={(e) => edit((d) => { const all = d.pause.services.length ? d.pause.services : [...d.services]; d.pause.services = e.target.checked ? [...new Set([...all, x])] : all.filter((y) => y !== x); if (d.pause.services.length === d.services.length) d.pause.services = []; })} /> {k(x)}</label>
                  ))}
                </div>
                <label className="f" htmlFor="pause-msg" style={{ flex: "1 1 240px" }}>{k("pauseMsg")}<input type="text" id="pause-msg" maxLength={200} value={s.pause.message} onChange={(e) => edit((d) => { d.pause.message = e.target.value; })} /></label>
                <button className="btn sm" onClick={pauseNow}>{k("pauseNow")}</button>
              </>
            )}
          </div>
        </section>

        <section className="card"><h3>{k("restaurant")}</h3>
          <div className="row2">
            <Text id="r-name" label={k("name")} value={s.name} onChange={(v) => edit((d) => { d.name = v; })} />
            <Text id="r-phone" label={k("phone")} value={s.phone} onChange={(v) => edit((d) => { d.phone = v; })} />
            <Text id="r-address" label={k("address")} value={s.address} onChange={(v) => edit((d) => { d.address = v; })} />
            <Text id="r-city" label={k("city")} value={s.city} onChange={(v) => edit((d) => { d.city = v; })} />
            <Text id="r-postcode" label={k("postcode")} value={s.postcode} onChange={(v) => edit((d) => { d.postcode = v; })} />
            <label className="f" htmlFor="r-lang">{k("defLang")}
              <select id="r-lang" value={s.defaultLang} onChange={(e) => edit((d) => { d.defaultLang = e.target.value as "it"; })}>
                <option value="it">Italiano</option><option value="en">English</option><option value="ar">العربية</option>
              </select>
            </label>
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            <span className="small muted">{k("notify")}</span>
            {s.notifyEmails.map((m, i) => (
              <div key={i} style={{ display: "flex", gap: 8 }}>
                <input type="email" aria-label={k("notify")} value={m} onChange={(e) => edit((d) => { d.notifyEmails[i] = e.target.value; })} />
                <button className="link" onClick={() => edit((d) => { d.notifyEmails.splice(i, 1); })}>{k("remove")}</button>
              </div>
            ))}
            <div><button className="btn sm ghost" onClick={() => edit((d) => { d.notifyEmails.push(""); })}>+ {k("addEmail")}</button></div>
          </div>
        </section>

        <section className="card"><h3>{k("services")}</h3>
          <div className="choice">{SVCS.map((x) => (
            <label key={x} htmlFor={`svc-${x}`}><input type="checkbox" id={`svc-${x}`} checked={s.services.includes(x)} onChange={(e) => edit((d) => { d.services = e.target.checked ? [...d.services, x] : d.services.filter((y) => y !== x); })} /> {k(x)}</label>
          ))}</div>
          <h3 style={{ marginTop: 8 }}>{k("payments")}</h3>
          {s.services.map((x) => (
            <div key={x}><b>{k(x)}</b>
              <div className="choice" style={{ marginTop: 6 }}>{PAYS.filter((p) => (x === "DELIVERY" ? p !== "card_counter" && p !== "card_table" : x === "PICKUP" ? p !== "card_courier" && p !== "card_table" : p !== "card_courier" && p !== "card_counter")).map((p) => (
                <label key={p} htmlFor={`pay-${x}-${p}`}><input type="checkbox" id={`pay-${x}-${p}`} checked={s.payments[x].includes(p)} onChange={(e) => edit((d) => { d.payments[x] = e.target.checked ? [...d.payments[x], p] : d.payments[x].filter((y) => y !== p); })} /> {k(p)}</label>
              ))}</div>
            </div>
          ))}
        </section>

        <section className="card"><h3>{k("hours")}</h3>
          {s.hours.map((h, hi) => (
            <div className="hrow" key={hi}>
              <select aria-label={k("services")} value={h.service ?? ""} onChange={(e) => edit((d) => { d.hours[hi].service = (e.target.value || null) as Svc | null; })} style={{ width: "auto" }}>
                <option value="">{k("allSvc")}</option>{s.services.map((x) => <option key={x} value={x}>{k(x)}</option>)}
              </select>
              <div className="dayrow">{[1, 2, 3, 4, 5, 6, 0].map((dd) => (
                <button key={dd} aria-pressed={h.days.includes(dd)} onClick={() => edit((d) => { const x = d.hours[hi]; x.days = x.days.includes(dd) ? x.days.filter((y) => y !== dd) : [...x.days, dd].sort(); })}>{DAYS[lang][dd]}</button>
              ))}</div>
              <label className="f" htmlFor={`h-${hi}-from`}>{k("from")}<input type="time" id={`h-${hi}-from`} value={h.from} onChange={(e) => edit((d) => { d.hours[hi].from = e.target.value; })} /></label>
              <label className="f" htmlFor={`h-${hi}-to`}>{k("to")}<input type="time" id={`h-${hi}-to`} value={h.to} onChange={(e) => edit((d) => { d.hours[hi].to = e.target.value; })} /></label>
              <button className="link" onClick={() => edit((d) => { d.hours.splice(hi, 1); })}>{k("remove")}</button>
            </div>
          ))}
          <div><button className="btn sm ghost" onClick={() => edit((d) => { d.hours.push({ service: null, days: [1, 2, 3, 4, 5, 6, 0], from: "12:00", to: "15:00" }); })}>+ {k("addHours")}</button></div>

          <h3 style={{ marginTop: 8 }}>{k("special")}</h3>
          {s.specialDays.map((sd, i) => (
            <div className="hrow" key={i}>
              <Text id={`sd-${i}-name`} label={k("spName")} value={sd.name} max={25} onChange={(v) => edit((d) => { d.specialDays[i].name = v; })} />
              <label className="f" htmlFor={`sd-${i}-from`}>{k("dateFrom")}<input type="date" id={`sd-${i}-from`} value={sd.dateFrom} onChange={(e) => edit((d) => { d.specialDays[i].dateFrom = e.target.value; if (d.specialDays[i].dateTo < e.target.value) d.specialDays[i].dateTo = e.target.value; })} /></label>
              <label className="f" htmlFor={`sd-${i}-to`}>{k("dateTo")}<input type="date" id={`sd-${i}-to`} value={sd.dateTo} onChange={(e) => edit((d) => { d.specialDays[i].dateTo = e.target.value; })} /></label>
              <select aria-label={k("services")} value={sd.service ?? ""} onChange={(e) => edit((d) => { d.specialDays[i].service = (e.target.value || null) as Svc | null; })} style={{ width: "auto" }}>
                <option value="">{k("allSvc")}</option>{s.services.map((x) => <option key={x} value={x}>{k(x)}</option>)}
              </select>
              <select aria-label={k("open")} value={sd.open ? "1" : "0"} onChange={(e) => edit((d) => { const o = e.target.value === "1"; d.specialDays[i].open = o; d.specialDays[i].from = o ? "12:00" : null; d.specialDays[i].to = o ? "15:00" : null; })} style={{ width: "auto" }}>
                <option value="0">{k("closed")}</option><option value="1">{k("open")}</option>
              </select>
              {sd.open && <>
                <label className="f" htmlFor={`sd-${i}-h1`}>{k("from")}<input type="time" id={`sd-${i}-h1`} value={sd.from ?? ""} onChange={(e) => edit((d) => { d.specialDays[i].from = e.target.value; })} /></label>
                <label className="f" htmlFor={`sd-${i}-h2`}>{k("to")}<input type="time" id={`sd-${i}-h2`} value={sd.to ?? ""} onChange={(e) => edit((d) => { d.specialDays[i].to = e.target.value; })} /></label>
              </>}
              <Text id={`sd-${i}-msg`} label={k("message")} value={sd.message} max={200} onChange={(v) => edit((d) => { d.specialDays[i].message = v; })} />
              <button className="link" onClick={() => edit((d) => { d.specialDays.splice(i, 1); })}>{k("remove")}</button>
            </div>
          ))}
          <div><button className="btn sm ghost" onClick={() => edit((d) => { const t = new Date().toISOString().slice(0, 10); d.specialDays.push({ name: "", dateFrom: t, dateTo: t, service: null, open: false, from: null, to: null, message: "" }); })}>+ {k("addSpecial")}</button></div>
        </section>

        <section className="card"><h3>{k("scheduled")}</h3>
          <label className="check"><input type="checkbox" checked={s.scheduledOrders} onChange={(e) => edit((d) => { d.scheduledOrders = e.target.checked; })} /> {k("schedOn")}</label>
          {s.scheduledOrders && <div className="row2">
            <Num id="sch-min" label={k("minNotice")} value={s.minNoticeMin} onChange={(v) => edit((d) => { d.minNoticeMin = num(v); })} />
            <Num id="sch-days" label={k("maxDays")} value={s.maxDaysAhead} max={30} onChange={(v) => edit((d) => { d.maxDaysAhead = Math.min(30, num(v)); })} />
            <label className="f" htmlFor="sch-slot">{k("slot")}
              <select id="sch-slot" value={s.slotMinutes} onChange={(e) => edit((d) => { d.slotMinutes = Number(e.target.value); })}>
                {[15, 30, 45, 60, 90, 120, 180, 240, 360].map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </label>
            <label className="check"><input type="checkbox" checked={s.hideAsap} onChange={(e) => edit((d) => { d.hideAsap = e.target.checked; })} /> {k("hideAsap")}</label>
          </div>}
          <h3 style={{ marginTop: 8 }}>{k("accept")}</h3>
          <label className="check"><input type="checkbox" checked={s.autoAccept} onChange={(e) => edit((d) => { d.autoAccept = e.target.checked; })} /> {k("autoAccept")}</label>
          <div className="row2">
            <Num id="prep-p" label={k("prepPickup")} value={s.prepPickupMin} onChange={(v) => edit((d) => { d.prepPickupMin = num(v, 1); })} />
            <Num id="prep-d" label={k("prepDelivery")} value={s.prepDeliveryMin} onChange={(v) => edit((d) => { d.prepDeliveryMin = num(v, 1); })} />
          </div>
        </section>

        {s.services.includes("DELIVERY") && (
          <section className="card"><h3>{k("zones")}</h3>
            <p className="small muted" style={{ margin: 0 }}>{k("zoneNote")}</p>
            {s.zones.map((z, i) => (
              <div className="hrow" key={z.id}>
                <input type="color" aria-label="Color" value={z.color} onChange={(e) => edit((d) => { d.zones[i].color = e.target.value; })} style={{ width: 44, height: 40, padding: 2 }} />
                <Text id={`z-${z.id}-name`} label={k("zName")} value={z.name} max={40} onChange={(v) => edit((d) => { d.zones[i].name = v; })} />
                <Money id={`z-${z.id}-min`} label={k("minOrder")} cents={z.minOrder} onChange={(c) => edit((d) => { d.zones[i].minOrder = c; })} />
                <Money id={`z-${z.id}-fee`} label={k("fee")} cents={z.fee} onChange={(c) => edit((d) => { d.zones[i].fee = c; })} />
                <Num id={`z-${z.id}-prep`} label={k("zPrep")} value={z.prepMin ?? ""} onChange={(v) => edit((d) => { d.zones[i].prepMin = v ? num(v, 1) : null; })} />
                <label className="check"><input type="checkbox" checked={z.hidden} onChange={(e) => edit((d) => { d.zones[i].hidden = e.target.checked; })} /> {k("hiddenZ")}</label>
                <button className="link" onClick={() => edit((d) => { d.zones.splice(i, 1); })}>{k("remove")}</button>
              </div>
            ))}
            <div><button className="btn sm ghost" onClick={() => edit((d) => { d.zones.push({ id: newId(), name: "", color: "#2c7a3c", minOrder: 1000, fee: 200, prepMin: null, hidden: false, radiusM: 3000 }); })}>+ {k("addZone")}</button></div>
          </section>
        )}

        <section className="card"><h3>{k("coupons")}</h3>
          {s.coupons.map((c, i) => (
            <div className="hrow" key={c.id}>
              <Text id={`cp-${c.id}-code`} label={k("code")} value={c.code} max={20} onChange={(v) => edit((d) => { d.coupons[i].code = v.toUpperCase().replace(/[^A-Z0-9_-]/g, ""); })} />
              <label className="f" htmlFor={`cp-${c.id}-kind`}>{k("kind")}
                <select id={`cp-${c.id}-kind`} value={c.kind} onChange={(e) => edit((d) => { d.coupons[i].kind = e.target.value as "percent"; d.coupons[i].value = e.target.value === "percent" ? 10 : e.target.value === "fixed" ? 500 : 0; })}>
                  <option value="percent">{k("percent")}</option><option value="fixed">{k("fixed")}</option><option value="free_delivery">{k("free_delivery")}</option>
                </select>
              </label>
              {c.kind === "percent" && <Num id={`cp-${c.id}-v`} label={k("value")} value={c.value} max={100} onChange={(v) => edit((d) => { d.coupons[i].value = Math.min(100, num(v)); })} />}
              {c.kind === "fixed" && <Money id={`cp-${c.id}-v`} label={k("value")} cents={c.value} onChange={(x) => edit((d) => { d.coupons[i].value = x; })} />}
              <Money id={`cp-${c.id}-min`} label={k("minOrder")} cents={c.minOrder} onChange={(x) => edit((d) => { d.coupons[i].minOrder = x; })} />
              <label className="f" htmlFor={`cp-${c.id}-to`}>{k("validTo")}<input type="date" id={`cp-${c.id}-to`} value={c.validTo ?? ""} onChange={(e) => edit((d) => { d.coupons[i].validTo = e.target.value || null; })} /></label>
              <label className="check"><input type="checkbox" checked={c.active} onChange={(e) => edit((d) => { d.coupons[i].active = e.target.checked; })} /> {k("active")}</label>
              <label className="check"><input type="checkbox" checked={c.onePerCustomer} onChange={(e) => edit((d) => { d.coupons[i].onePerCustomer = e.target.checked; })} /> {k("onePer")}</label>
              {uses[c.id] !== undefined && <span className="small muted">{k("used")}: <span className="num">{uses[c.id]}</span></span>}
              <button className="link" onClick={() => edit((d) => { d.coupons.splice(i, 1); })}>{k("remove")}</button>
            </div>
          ))}
          <div><button className="btn sm ghost" onClick={() => edit((d) => { d.coupons.push({ id: newId(), code: "", kind: "percent", value: 10, minOrder: 0, onePerCustomer: false, active: true, validTo: null }); })}>+ {k("addCoupon")}</button></div>
        </section>

        <section className="card"><h3>{k("tax")}</h3>
          <label className="check"><input type="checkbox" checked={s.taxIncluded} onChange={(e) => edit((d) => { d.taxIncluded = e.target.checked; })} /> {k("taxIncl")}</label>
          <div className="row2">
            <Text id="tax-name" label={k("taxName")} value={s.taxName} max={20} onChange={(v) => edit((d) => { d.taxName = v; })} />
            <label className="f" htmlFor="tax-rate">{k("taxRate")}<input type="number" id="tax-rate" min={0} max={50} step={0.5} value={s.taxRateBp / 100} onChange={(e) => edit((d) => { d.taxRateBp = Math.round(Math.min(50, num(e.target.value)) * 100); })} /></label>
          </div>
        </section>
      </div></div>

      <div className="savebar"><div className="wrap">
        <span className="small" style={{ flex: 1 }}>{status === "error" ? <span className="err">{k("err")}{errMsg ? ` · ${errMsg}` : ""}</span> : status === "saved" ? k("saved") : dirty ? <span className="muted">{k("unsaved")}</span> : ""}</span>
        <button className="btn ghost" disabled={!dirty || status === "saving"} onClick={() => { setS(saved); setStatus(""); }}>{k("discard")}</button>
        <button className="btn" disabled={!dirty || status === "saving"} onClick={() => save()}>{k("save")}</button>
      </div></div>
    </>
  );
}

function Text({ id, label, value, onChange, max = 120 }: { id: string; label: string; value: string; onChange: (v: string) => void; max?: number }) {
  return <label className="f" htmlFor={id}>{label}<input type="text" id={id} maxLength={max} value={value} onChange={(e) => onChange(e.target.value)} /></label>;
}
function Num({ id, label, value, onChange, max }: { id: string; label: string; value: number | ""; onChange: (v: string) => void; max?: number }) {
  return <label className="f" htmlFor={id}>{label}<input type="number" id={id} min={0} max={max} value={value} onChange={(e) => onChange(e.target.value)} /></label>;
}
function Money({ id, label, cents, onChange }: { id: string; label: string; cents: number; onChange: (c: number) => void }) {
  const [text, setText] = useState(toEuro(cents));
  useEffect(() => { if (toCents(text) !== cents) setText(toEuro(cents)); }, [cents]); // eslint-disable-line react-hooks/exhaustive-deps
  return <label className="f" htmlFor={id}>{label}<input type="text" inputMode="decimal" dir="ltr" id={id} value={text} onChange={(e) => { setText(e.target.value); onChange(toCents(e.target.value)); }} onBlur={() => setText(toEuro(cents))} /></label>;
}
