"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LOCALE, money, pickLang, t as ct, tableLabel, tr, type Lang } from "@/lib/i18n";
import DashNav from "./DashNav";

type Item = { id: string; name: Record<string, string>; sizeName: Record<string, string> | null; qty: number; options: { name: Record<string, string> }[]; instructions: string | null; total: number };
type Order = {
  id: string; number: number; status: string; type: "PICKUP" | "DELIVERY" | "DINEIN"; asap: boolean; fulfillAt: string | null; readyAt: string | null;
  firstName: string; lastName: string; email: string; phone: string; address: { street: string; city: string; more?: string } | null; table: string | null;
  payment: string; comments: string | null; couponCode: string | null; subtotal: number; discount: number; deliveryFee: number; tax: number; total: number;
  rejectReason: string | null; respondBy: string | null; createdAt: string; items: Item[];
};
type R = { id: string; name: string; slug: string; currency: string; timezone?: string };

const K: Record<Lang, Record<string, string>> = {
  it: { test: "Ordine di prova", testDone: "Ordine di prova creato", pause: "Pausa", resume: "Riprendi ordini", pausedUntil: "Ordini in pausa fino alle", m30: "30 min", h1: "1 ora", h2: "2 ore", stock: "Esauriti", available: "Disponibile", untilTomorrow: "Esaurito fino a domani", indefinite: "Esaurito", options: "Opzioni", printKitchen: "Stampa cucina", printCustomer: "Stampa cliente", settings: "Impostazioni app", autoPrint: "Stampa automatica quando accetti", apNone: "No", apKitchen: "Scontrino cucina", apCustomer: "Ricevuta cliente", apBoth: "Cucina + cliente", paper: "Carta", nativeOn: "App Android: suono e stampa funzionano anche a schermo spento.", printer: "Stampante Bluetooth", noPrinter: "Nessuna (abbina prima la stampante nelle impostazioni Bluetooth del telefono)", copies: "Copie", testPrint: "Stampa di prova", printed: "Stampato", printErr: "Stampa non riuscita", changeServer: "Cambia indirizzo server", appStatus: "Stato app", installHint: "Per usarla come app: menu del browser → Aggiungi a schermata Home. Tieni il telefono in carica e con il volume alto.", close: "Chiudi", orders: "Ordini", tPending: "Nuovi", tActive: "In preparazione", tDone: "Chiusi", soundOn: "Suono attivo", soundOff: "Attiva suono", acceptIn: "Accetta, pronto tra (minuti):", reject: "Rifiuta", cancel: "Annulla ordine", markReady: "Pronto", complete: "Consegnato", reason: "Motivo", noOrders: "Nessun ordine qui.", newOrder: "Nuovo ordine", queued: "Pre-ordine: suonerà all'apertura", respond: "Rispondi entro", maps: "Apri in Maps", copy: "Copia dati", copied: "Copiato", for: "Per", offline: "Connessione persa. Riprovo…", missed: "Perso" },
  en: { test: "Test order", testDone: "Test order created", pause: "Pause", resume: "Resume orders", pausedUntil: "Orders paused until", m30: "30 min", h1: "1 hour", h2: "2 hours", stock: "Sold out", available: "Available", untilTomorrow: "Sold out until tomorrow", indefinite: "Sold out", options: "Options", printKitchen: "Print kitchen", printCustomer: "Print customer", settings: "App settings", autoPrint: "Print automatically when you accept", apNone: "No", apKitchen: "Kitchen ticket", apCustomer: "Customer receipt", apBoth: "Kitchen + customer", paper: "Paper", nativeOn: "Android app: sound and printing work with the screen off too.", printer: "Bluetooth printer", noPrinter: "None (first pair the printer in the phone's Bluetooth settings)", copies: "Copies", testPrint: "Test print", printed: "Printed", printErr: "Printing failed", changeServer: "Change server address", appStatus: "App status", installHint: "To use it as an app: browser menu → Add to Home screen. Keep the phone charging with the volume up.", close: "Close", orders: "Orders", tPending: "New", tActive: "Preparing", tDone: "Closed", soundOn: "Sound on", soundOff: "Turn on sound", acceptIn: "Accept, ready in (minutes):", reject: "Decline", cancel: "Cancel order", markReady: "Ready", complete: "Handed over", reason: "Reason", noOrders: "No orders here.", newOrder: "New order", queued: "Pre-order: rings at opening time", respond: "Answer within", maps: "Open in Maps", copy: "Copy details", copied: "Copied", for: "For", offline: "Connection lost. Retrying…", missed: "Missed" },
  ar: { test: "طلب تجريبي", testDone: "اتعمل طلب تجريبي", pause: "إيقاف", resume: "رجّع الطلبات", pausedUntil: "الطلبات متوقفة لحد", m30: "نص ساعة", h1: "ساعة", h2: "ساعتين", stock: "الخلصان", available: "متاح", untilTomorrow: "خلصان لحد بكره", indefinite: "خلصان", options: "الإضافات", printKitchen: "اطبع للمطبخ", printCustomer: "اطبع للعميل", settings: "إعدادات التطبيق", autoPrint: "اطبع تلقائي لما تقبل", apNone: "لا", apKitchen: "تذكرة المطبخ", apCustomer: "إيصال العميل", apBoth: "المطبخ + العميل", paper: "الورق", nativeOn: "تطبيق أندرويد: الصوت والطباعة شغالين حتى والشاشة مقفولة.", printer: "طابعة بلوتوث", noPrinter: "مفيش (اعمل pairing للطابعة الأول من إعدادات البلوتوث في الموبايل)", copies: "عدد النسخ", testPrint: "طباعة تجريبية", printed: "اتطبع", printErr: "الطباعة ماتمّتش", changeServer: "غيّر عنوان السيرفر", appStatus: "حالة التطبيق", installHint: "عشان تستخدمه كتطبيق: قايمة المتصفح ← إضافة للشاشة الرئيسية. خلي الموبايل على الشاحن والصوت عالي.", close: "قفل", orders: "الطلبات", tPending: "جديدة", tActive: "قيد التحضير", tDone: "منتهية", soundOn: "الصوت يعمل", soundOff: "شغّل الصوت", acceptIn: "اقبل، جاهز خلال (دقيقة):", reject: "رفض", cancel: "إلغاء الطلب", markReady: "جاهز", complete: "تم التسليم", reason: "السبب", noOrders: "لا توجد طلبات هنا.", newOrder: "طلب جديد", queued: "طلب مسبق: هيرن وقت الفتح", respond: "رد خلال", maps: "افتح في الخرائط", copy: "انسخ البيانات", copied: "تم النسخ", for: "موعد", offline: "الاتصال مقطوع. بنحاول تاني…", missed: "فات" },
};
const REASONS = ["rTooBusy", "rClosed", "rItem", "rArea", "rOther"];

/** Bridge injected by the Menuto Android app (see android-app/). Absent in a normal browser. */
type NativeBridge = {
  isNative(): boolean; printers(): string; settings(): string; configure(json: string): void;
  watch(rid: string): void; stopWatching(): void; printPath(path: string): void; changeServer(): void;
};
declare global { interface Window { MenutoNative?: NativeBridge } }
const nativeApp = () => (typeof window !== "undefined" && window.MenutoNative?.isNative?.() ? window.MenutoNative : null);

export default function KitchenBoard({ restaurant, restaurants, isPartner = false, staff = false }: { restaurant: R; restaurants: R[]; isPartner?: boolean; staff?: boolean }) {
  const [lang, setLang] = useState<Lang>("it");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [offline, setOffline] = useState(false);
  const [tab, setTab] = useState<"pending" | "active" | "done" | "stock">("pending");
  const [pause, setPause] = useState<{ pausedUntil: string | null } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [autoPrint, setAutoPrint] = useState("none");
  const [paper, setPaper] = useState("42");
  const wake = useRef<WakeLockSentinel | null>(null);
  const [native, setNative] = useState<NativeBridge | null>(null);
  const [printers, setPrinters] = useState<{ name: string; address: string }[]>([]);
  const [nset, setNset] = useState<{ printer: string | null; autoPrint: string; cols: number; copies: number; lastError: string | null; version: string } | null>(null);
  const [sound, setSound] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [toast, setToast] = useState("");
  const actx = useRef<AudioContext | null>(null);
  const k = (key: string) => K[lang][key] ?? key;
  const t = (key: string, v?: Record<string, string | number>) => ct(lang, key, v);
  const fmt = (c: number) => money(c, lang, restaurant.currency);
  // always the restaurant's clock, whatever time zone the device is set to
  const tz = restaurant.timezone ?? "Europe/Rome";
  const hm = (iso: string) => new Date(iso).toLocaleTimeString(LOCALE[lang], { timeZone: tz, hour: "2-digit", minute: "2-digit" });
  const time = (iso: string) => new Date(iso).toLocaleString(LOCALE[lang], { timeZone: tz, weekday: "short", hour: "2-digit", minute: "2-digit" });

  // inside the Android app: hand the restaurant to the background watcher and read the app's own settings
  useEffect(() => {
    const n = nativeApp();
    if (!n) return;
    setNative(n);
    n.watch(restaurant.id);
    try { setPrinters(JSON.parse(n.printers())); setNset(JSON.parse(n.settings())); } catch { /* old app */ }
    const onPrint = (e: Event) => { const d = (e as CustomEvent).detail as { ok: boolean; error?: string }; setToast(d.ok ? k("printed") : `${k("printErr")}: ${d.error === "no-printer" ? k("noPrinter") : d.error}`); setTimeout(() => setToast(""), 2500); };
    window.addEventListener("menuto-print", onPrint);
    return () => window.removeEventListener("menuto-print", onPrint);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurant.id]);
  function nativeConfigure(patch: Record<string, unknown>) {
    if (!native) return;
    native.configure(JSON.stringify(patch));
    try { setNset(JSON.parse(native.settings())); } catch { /* ignore */ }
  }
  useEffect(() => {
    try { setAutoPrint(localStorage.getItem("menuto.autoPrint") ?? "none"); setPaper(localStorage.getItem("menuto.paper") ?? "42"); } catch { /* storage unavailable */ }
    fetch(`/api/kitchen/${restaurant.id}/pause`).then((r) => r.json()).then(setPause).catch(() => {});
  }, [restaurant.id]);
  useEffect(() => {
    const l = pickLang(navigator.languages, "it");
    setLang(l); document.documentElement.lang = l; document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/kitchen/${restaurant.id}/orders`, { cache: "no-store" });
      if (res.status === 401) { location.href = "/login"; return; }
      const j = await res.json();
      setOrders(j.orders); setLoaded(true); setOffline(false);
    } catch { setOffline(true); }
  }, [restaurant.id]);

  // poll every 3 s and recover automatically when the connection comes back
  useEffect(() => {
    load();
    const a = setInterval(load, 3000);
    const b = setInterval(() => setNow(Date.now()), 1000);
    const onOnline = () => load();
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onOnline);
    return () => { clearInterval(a); clearInterval(b); window.removeEventListener("online", onOnline); document.removeEventListener("visibilitychange", onOnline); };
  }, [load]);

  const ringing = orders.filter((o) => o.status === "PENDING" && o.respondBy && new Date(o.respondBy).getTime() - now <= 4 * 60000);
  useEffect(() => {
    if (!sound || !ringing.length || native) return;
    const beep = () => {
      const ctx = actx.current; if (!ctx) return;
      const t0 = ctx.currentTime;
      [0, 0.22, 0.44].forEach((dt, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "square"; o.frequency.value = i === 1 ? 1046 : 880;
        g.gain.setValueAtTime(0.0001, t0 + dt); g.gain.exponentialRampToValueAtTime(0.3, t0 + dt + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dt + 0.18);
        o.connect(g).connect(ctx.destination); o.start(t0 + dt); o.stop(t0 + dt + 0.2);
      });
    };
    beep();
    const id = setInterval(beep, 2600);
    return () => clearInterval(id);
  }, [sound, ringing.length, native]);
  useEffect(() => { document.title = ringing.length ? `(${ringing.length}) ${k("newOrder")}` : `${k("orders")} · ${restaurant.name}`; });

  async function act(o: Order, body: Record<string, unknown>) {
    const res = await fetch(`/api/kitchen/${restaurant.id}/orders/${o.id}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok && res.status !== 409) setToast(k("offline"));
    load();
  }
  async function keepAwake() {
    try { if ("wakeLock" in navigator && !wake.current) { wake.current = await navigator.wakeLock.request("screen"); wake.current.addEventListener("release", () => { wake.current = null; }); } } catch { /* not allowed */ }
  }
  useEffect(() => {
    const again = () => { if (sound && document.visibilityState === "visible") keepAwake(); };
    document.addEventListener("visibilitychange", again);
    return () => document.removeEventListener("visibilitychange", again);
  }, [sound]);
  function enableSound() {
    if (sound) { setSound(false); wake.current?.release(); return; }
    try { actx.current = actx.current ?? new AudioContext(); actx.current.resume(); } catch { /* no audio */ }
    setSound(true);
    keepAwake();
  }
  const receiptUrl = (o: Order, t: string) => `/api/kitchen/${restaurant.id}/orders/${o.id}/receipt?t=${t}&cols=${paper}`;
  function print(o: Order, t: string) {
    if (native) native.printPath(`/api/kitchen/${restaurant.id}/orders/${o.id}/receipt?t=${t}&f=escpos&cols=${nset?.cols ?? 42}`);
    else window.open(receiptUrl(o, t), "_blank");
  }
  async function accept(o: Order, prepMin: number) {
    // open the print window inside the click, before awaiting, so the browser allows it
    const which = autoPrint === "both" ? "kitchen,customer" : autoPrint;
    // in the Android app the background service prints accepted orders itself
    const w = !native && autoPrint !== "none" ? window.open("about:blank", "_blank") : null;
    await act(o, { action: "accept", prepMin });
    if (w) w.location.href = receiptUrl(o, which);
  }
  async function testOrder() {
    const res = await fetch(`/api/kitchen/${restaurant.id}/test-order`, { method: "POST" });
    if (res.ok) { setTab("pending"); setToast(k("testDone")); setTimeout(() => setToast(""), 1500); load(); }
  }
  async function setPaused(minutes: number) {
    const res = await fetch(`/api/kitchen/${restaurant.id}/pause`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ minutes }) });
    if (res.ok) { const j = await res.json(); setPause(j); }
  }
  const pausedUntil = pause?.pausedUntil && new Date(pause.pausedUntil).getTime() > now ? new Date(pause.pausedUntil) : null;
  async function copy(o: Order) {
    const text = [`#${o.number} ${o.firstName} ${o.lastName}`.trim(), o.table ? tableLabel(lang, o.table) : "", o.phone, o.address ? `${o.address.street}, ${o.address.city}${o.address.more ? " · " + o.address.more : ""}` : ""].filter(Boolean).join("\n");
    try { await navigator.clipboard.writeText(text); setToast(k("copied")); setTimeout(() => setToast(""), 1500); } catch { /* clipboard blocked */ }
  }

  const groups = {
    pending: orders.filter((o) => o.status === "PENDING"),
    active: orders.filter((o) => o.status === "ACCEPTED" || o.status === "READY"),
    done: orders.filter((o) => ["COMPLETED", "REJECTED", "MISSED", "CANCELED"].includes(o.status)),
  };
  const list = tab === "stock" ? [] : groups[tab];

  return (
    <>
      <DashNav lang={lang} current="orders" restaurant={restaurant} restaurants={restaurants} isPartner={isPartner} staff={staff} />
      <div className="wrap">
        <div className="kbar">
          <h2>{k("orders")} · {restaurant.name}</h2>
          {native ? <span className="pill ok">{k("nativeOn")}</span> : <button className={`btn sm${sound ? " ok" : ""}`} onClick={enableSound}>{sound ? k("soundOn") : k("soundOff")}</button>}
          <button className="btn sm ghost" onClick={testOrder}>{k("test")}</button>
          <button className="btn sm ghost" onClick={() => setShowSettings(!showSettings)} aria-expanded={showSettings}>{k("settings")}</button>
        </div>
        <div className="hrow" style={{ marginBottom: 12 }}>
          {pausedUntil ? (
            <><span className="pill bad"><span className="dot" />{k("pausedUntil")} {pausedUntil.toLocaleTimeString(LOCALE[lang], { timeZone: tz, hour: "2-digit", minute: "2-digit" })}</span>
              <button className="btn sm" onClick={() => setPaused(0)}>{k("resume")}</button></>
          ) : (
            <><span className="small muted">{k("pause")}:</span>
              {[[30, "m30"], [60, "h1"], [120, "h2"]].map(([m, l]) => <button key={m} className="btn sm ghost" onClick={() => setPaused(m as number)}>{k(l as string)}</button>)}</>
          )}
        </div>
        {showSettings && native && nset && (
          <div className="card" style={{ padding: 16, marginBottom: 14, display: "grid", gap: 10 }}>
            <div className="row2">
              <label className="f" htmlFor="n-printer">{k("printer")}
                <select id="n-printer" value={nset.printer ?? ""} onChange={(e) => nativeConfigure({ printer: e.target.value })}>
                  <option value="">{k("noPrinter")}</option>
                  {printers.map((p) => <option key={p.address} value={p.address}>{p.name}</option>)}
                </select>
              </label>
              <label className="f" htmlFor="n-ap">{k("autoPrint")}
                <select id="n-ap" value={nset.autoPrint} onChange={(e) => nativeConfigure({ autoPrint: e.target.value })}>
                  <option value="none">{k("apNone")}</option><option value="kitchen">{k("apKitchen")}</option><option value="customer">{k("apCustomer")}</option><option value="kitchen,customer">{k("apBoth")}</option>
                </select>
              </label>
              <label className="f" htmlFor="n-cols">{k("paper")}
                <select id="n-cols" value={nset.cols} onChange={(e) => nativeConfigure({ cols: Number(e.target.value) })}><option value={42}>80 mm</option><option value={32}>58 mm</option></select>
              </label>
              <label className="f" htmlFor="n-copies">{k("copies")}
                <select id="n-copies" value={nset.copies} onChange={(e) => nativeConfigure({ copies: Number(e.target.value) })}>{[1, 2, 3].map((n) => <option key={n} value={n}>{n}</option>)}</select>
              </label>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="btn sm" onClick={() => native.printPath(`/api/kitchen/${restaurant.id}/test-print?cols=${nset.cols}`)}>{k("testPrint")}</button>
              <button className="btn sm ghost" onClick={() => native.changeServer()}>{k("changeServer")}</button>
            </div>
            <p className="small muted" style={{ margin: 0 }}>{k("appStatus")}: {nset.lastError ?? "OK"} · v{nset.version}</p>
          </div>
        )}
        {showSettings && !native && (
          <div className="card" style={{ padding: 16, marginBottom: 14, display: "grid", gap: 10 }}>
            <div className="row2">
              <label className="f" htmlFor="ap">{k("autoPrint")}
                <select id="ap" value={autoPrint} onChange={(e) => { setAutoPrint(e.target.value); try { localStorage.setItem("menuto.autoPrint", e.target.value); } catch { /* ignore */ } }}>
                  <option value="none">{k("apNone")}</option><option value="kitchen">{k("apKitchen")}</option><option value="customer">{k("apCustomer")}</option><option value="both">{k("apBoth")}</option>
                </select>
              </label>
              <label className="f" htmlFor="paper">{k("paper")}
                <select id="paper" value={paper} onChange={(e) => { setPaper(e.target.value); try { localStorage.setItem("menuto.paper", e.target.value); } catch { /* ignore */ } }}>
                  <option value="42">80 mm</option><option value="32">58 mm</option>
                </select>
              </label>
            </div>
            <p className="small muted" style={{ margin: 0 }}>{k("installHint")}</p>
          </div>
        )}
        {offline && <p className="note">{k("offline")}</p>}
        <div className="tabs" role="tablist" style={{ marginBottom: 14 }}>
          {(["pending", "active", "done"] as const).map((x) => (
            <button key={x} role="tab" aria-selected={tab === x} onClick={() => setTab(x)}>
              {k(x === "pending" ? "tPending" : x === "active" ? "tActive" : "tDone")} <span className="num">({groups[x].length})</span>
            </button>
          ))}
          <button role="tab" aria-selected={tab === "stock"} onClick={() => setTab("stock")}>{k("stock")}</button>
        </div>
        {tab === "stock" ? <Stock rid={restaurant.id} lang={lang} k={k} /> : !loaded ? <p className="empty">…</p> : !list.length ? <p className="empty">{k("noOrders")}</p> : (
          <div className="orders">{list.map((o) => {
            const left = o.respondBy ? new Date(o.respondBy).getTime() - now : 0;
            const queued = o.status === "PENDING" && left > 4 * 60000;
            return (
              <article key={o.id} className={`card order${o.status === "PENDING" && !queued ? " new" : ""}`}>
                <div className="oh">
                  <span className="oid num">#{o.number}</span>
                  {o.table && <span className="tablebadge">{tableLabel(lang, o.table)}</span>}
                  <StatusPill o={o} k={k} t={t} />
                </div>
                <div className="small muted">
                  {time(o.createdAt)} · <b>{t(o.type)}</b> · {k("for")} {o.asap ? t("asap") : o.fulfillAt ? time(o.fulfillAt) : ""}
                  {o.status === "PENDING" && (queued ? <> · {k("queued")}</> : <> · {k("respond")} <span className="countdown num">{Math.max(0, Math.floor(left / 60000))}:{String(Math.max(0, Math.floor((left % 60000) / 1000))).padStart(2, "0")}</span></>)}
                </div>
                <ul>{o.items.map((l) => (
                  <li key={l.id}><span className="q num">{l.qty}×</span>
                    <span style={{ flex: 1 }}>{tr(l.name, lang)}
                      <span className="o">{[l.sizeName && tr(l.sizeName, lang), ...l.options.map((x) => tr(x.name, lang))].filter(Boolean).join(", ")}</span>
                      {l.instructions && <span className="o"><b>“{l.instructions}”</b></span>}
                    </span>
                    <span className="num">{fmt(l.total)}</span></li>
                ))}</ul>
                {o.comments && <div className="note">{o.comments}</div>}
                <div className="totals num">
                  {o.discount > 0 && <div><span>{t("discount")}{o.couponCode ? ` (${o.couponCode})` : ""}</span><span>−{fmt(o.discount)}</span></div>}
                  {o.type === "DELIVERY" && <div><span>{t("deliveryFee")}</span><span>{fmt(o.deliveryFee)}</span></div>}
                  <div className="grand"><span>{t("total")} · {t(o.payment)}</span><span>{fmt(o.total)}</span></div>
                </div>
                <div className="meta">
                  <b>{o.firstName} {o.lastName}</b>
                  <span className="num" style={{ userSelect: "all" }}>{o.phone}</span>
                  <span className="small muted">{o.email}</span>
                  {o.address && <span>{o.address.street}, {o.address.city}{o.address.more ? ` · ${o.address.more}` : ""}</span>}
                  <span style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {o.address && <a className="link" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${o.address.street}, ${o.address.city}`)}`}>{k("maps")}</a>}
                    <button className="link" onClick={() => copy(o)}>{k("copy")}</button>
                  </span>
                </div>
                <Actions o={o} k={k} t={t} act={act} accept={accept} hm={hm} />
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button className="btn sm ghost" onClick={() => print(o, "kitchen")}>{k("printKitchen")}</button>
                  <button className="btn sm ghost" onClick={() => print(o, "customer")}>{k("printCustomer")}</button>
                </div>
              </article>
            );
          })}</div>
        )}
      </div>
      {toast && <div className="toast" role="status">{toast}</div>}
    </>
  );
}

function StatusPill({ o, k, t }: { o: Order; k: (s: string) => string; t: (s: string) => string }) {
  const cls = o.status === "PENDING" ? "bad" : o.status === "ACCEPTED" || o.status === "READY" ? "ok" : "neutral";
  return <span className={`pill ${cls}`}>{o.status === "PENDING" ? <><span className="dot" />{k("newOrder")}</> : o.status === "MISSED" ? k("missed") : t(o.status)}</span>;
}

function Actions({ o, k, t, act, accept, hm }: { o: Order; k: (s: string) => string; t: (s: string) => string; act: (o: Order, b: Record<string, unknown>) => void; accept: (o: Order, m: number) => void; hm: (iso: string) => string }) {
  const [reason, setReason] = useState(REASONS[0]);
  const reasonSelect = (
    <select aria-label={k("reason")} value={reason} onChange={(e) => setReason(e.target.value)} style={{ flex: 1 }}>
      {REASONS.map((r) => <option key={r} value={r}>{t(r)}</option>)}
    </select>
  );
  if (o.status === "PENDING" || o.status === "MISSED") {
    return (
      <div className="big-actions" style={{ display: "grid", gap: 8 }}>
        <div className="small muted">{k("acceptIn")}</div>
        <div className="prep">{[10, 15, 20, 30, 45, 60].map((m) => <button key={m} className="num" onClick={() => accept(o, m)}>{m}</button>)}</div>
        <div style={{ display: "flex", gap: 8 }}>{reasonSelect}<button className="btn sm ghost" onClick={() => act(o, { action: "reject", reason })}>{k("reject")}</button></div>
      </div>
    );
  }
  if (o.status === "ACCEPTED" || o.status === "READY") {
    return (
      <div style={{ display: "grid", gap: 8 }}>
        {o.readyAt && <div className="small">{t("readyAt")} <b className="num">{hm(o.readyAt)}</b></div>}
        {o.status === "ACCEPTED"
          ? <button className="btn ok block" onClick={() => act(o, { action: "ready" })}>{k("markReady")}</button>
          : <button className="btn block" onClick={() => act(o, { action: "complete" })}>{k("complete")}</button>}
        <div style={{ display: "flex", gap: 8 }}>{reasonSelect}<button className="btn sm ghost" onClick={() => act(o, { action: "cancel", reason })}>{k("cancel")}</button></div>
      </div>
    );
  }
  return o.rejectReason ? <div className="small muted">{k("reason")}: {t(o.rejectReason)}</div> : null;
}

type StockRow = { id: string; name: Record<string, string>; state: "available" | "tomorrow" | "indefinite" };
function Stock({ rid, lang, k }: { rid: string; lang: Lang; k: (s: string) => string }) {
  const [data, setData] = useState<{ categories: { id: string; name: Record<string, string>; items: StockRow[] }[]; groups: { id: string; name: Record<string, string>; options: StockRow[] }[] } | null>(null);
  const load = useCallback(() => { fetch(`/api/kitchen/${rid}/stock`).then((r) => r.json()).then(setData).catch(() => {}); }, [rid]);
  useEffect(() => { load(); }, [load]);
  async function set(kind: "item" | "option", id: string, state: StockRow["state"]) {
    await fetch(`/api/kitchen/${rid}/stock`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind, id, state }) });
    load();
  }
  if (!data) return <p className="empty">…</p>;
  const row = (kind: "item" | "option", x: StockRow) => (
    <div key={x.id} className="hrow" style={{ justifyContent: "space-between" }}>
      <b style={{ flex: "1 1 160px" }}>{tr(x.name, lang)}</b>
      <div className="tabs">
        {(["available", "tomorrow", "indefinite"] as const).map((st) => (
          <button key={st} aria-pressed={x.state === st} onClick={() => set(kind, x.id, st)}>{k(st === "available" ? "available" : st === "tomorrow" ? "untilTomorrow" : "indefinite")}</button>
        ))}
      </div>
    </div>
  );
  return (
    <div style={{ display: "grid", gap: 14, paddingBottom: 80 }}>
      {data.categories.map((c) => <section key={c.id} className="card" style={{ padding: 14, display: "grid", gap: 8 }}><h3>{tr(c.name, lang)}</h3>{c.items.map((i) => row("item", i))}</section>)}
      {data.groups.length > 0 && <section className="card" style={{ padding: 14, display: "grid", gap: 8 }}><h3>{k("options")}</h3>
        {data.groups.map((g) => <div key={g.id} style={{ display: "grid", gap: 8 }}><span className="small muted">{tr(g.name, lang)}</span>{g.options.map((o) => row("option", o))}</div>)}
      </section>}
    </div>
  );
}
