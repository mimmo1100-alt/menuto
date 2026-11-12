"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LOCALE, money, pickLang, t as ct, tr, type Lang } from "@/lib/i18n";
import DashNav from "./DashNav";

type Item = { id: string; name: Record<string, string>; sizeName: Record<string, string> | null; qty: number; options: { name: Record<string, string> }[]; instructions: string | null; total: number };
type Order = {
  id: string; number: number; status: string; type: "PICKUP" | "DELIVERY" | "DINEIN"; asap: boolean; fulfillAt: string | null; readyAt: string | null;
  firstName: string; lastName: string; email: string; phone: string; address: { street: string; city: string; more?: string } | null; table: string | null;
  payment: string; comments: string | null; couponCode: string | null; subtotal: number; discount: number; deliveryFee: number; tax: number; total: number;
  rejectReason: string | null; respondBy: string | null; createdAt: string; items: Item[];
};
type R = { id: string; name: string; slug: string; currency: string };

const K: Record<Lang, Record<string, string>> = {
  it: { orders: "Ordini", tPending: "Nuovi", tActive: "In preparazione", tDone: "Chiusi", soundOn: "Suono attivo", soundOff: "Attiva suono", acceptIn: "Accetta, pronto tra (minuti):", reject: "Rifiuta", cancel: "Annulla ordine", markReady: "Pronto", complete: "Consegnato", reason: "Motivo", noOrders: "Nessun ordine qui.", newOrder: "Nuovo ordine", queued: "Pre-ordine: suonerà all'apertura", respond: "Rispondi entro", maps: "Apri in Maps", copy: "Copia dati", copied: "Copiato", for: "Per", offline: "Connessione persa. Riprovo…", missed: "Perso" },
  en: { orders: "Orders", tPending: "New", tActive: "Preparing", tDone: "Closed", soundOn: "Sound on", soundOff: "Turn on sound", acceptIn: "Accept, ready in (minutes):", reject: "Decline", cancel: "Cancel order", markReady: "Ready", complete: "Handed over", reason: "Reason", noOrders: "No orders here.", newOrder: "New order", queued: "Pre-order: rings at opening time", respond: "Answer within", maps: "Open in Maps", copy: "Copy details", copied: "Copied", for: "For", offline: "Connection lost. Retrying…", missed: "Missed" },
  ar: { orders: "الطلبات", tPending: "جديدة", tActive: "قيد التحضير", tDone: "منتهية", soundOn: "الصوت يعمل", soundOff: "شغّل الصوت", acceptIn: "اقبل، جاهز خلال (دقيقة):", reject: "رفض", cancel: "إلغاء الطلب", markReady: "جاهز", complete: "تم التسليم", reason: "السبب", noOrders: "لا توجد طلبات هنا.", newOrder: "طلب جديد", queued: "طلب مسبق: هيرن وقت الفتح", respond: "رد خلال", maps: "افتح في الخرائط", copy: "انسخ البيانات", copied: "تم النسخ", for: "موعد", offline: "الاتصال مقطوع. بنحاول تاني…", missed: "فات" },
};
const REASONS = ["rTooBusy", "rClosed", "rItem", "rArea", "rOther"];

export default function KitchenBoard({ restaurant, restaurants }: { restaurant: R; restaurants: R[] }) {
  const [lang, setLang] = useState<Lang>("it");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [offline, setOffline] = useState(false);
  const [tab, setTab] = useState<"pending" | "active" | "done">("pending");
  const [sound, setSound] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [toast, setToast] = useState("");
  const actx = useRef<AudioContext | null>(null);
  const k = (key: string) => K[lang][key] ?? key;
  const t = (key: string) => ct(lang, key);
  const fmt = (c: number) => money(c, lang, restaurant.currency);
  const time = (iso: string) => new Date(iso).toLocaleString(LOCALE[lang], { weekday: "short", hour: "2-digit", minute: "2-digit" });

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
    if (!sound || !ringing.length) return;
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
  }, [sound, ringing.length]);
  useEffect(() => { document.title = ringing.length ? `(${ringing.length}) ${k("newOrder")}` : `${k("orders")} · ${restaurant.name}`; });

  async function act(o: Order, body: Record<string, unknown>) {
    const res = await fetch(`/api/kitchen/${restaurant.id}/orders/${o.id}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok && res.status !== 409) setToast(k("offline"));
    load();
  }
  function enableSound() {
    if (sound) { setSound(false); return; }
    try { actx.current = actx.current ?? new AudioContext(); actx.current.resume(); } catch { /* no audio */ }
    setSound(true);
  }
  async function copy(o: Order) {
    const text = [`#${o.number} ${o.firstName} ${o.lastName}`, o.phone, o.address ? `${o.address.street}, ${o.address.city}${o.address.more ? " · " + o.address.more : ""}` : ""].filter(Boolean).join("\n");
    try { await navigator.clipboard.writeText(text); setToast(k("copied")); setTimeout(() => setToast(""), 1500); } catch { /* clipboard blocked */ }
  }

  const groups = {
    pending: orders.filter((o) => o.status === "PENDING"),
    active: orders.filter((o) => o.status === "ACCEPTED" || o.status === "READY"),
    done: orders.filter((o) => ["COMPLETED", "REJECTED", "MISSED", "CANCELED"].includes(o.status)),
  };
  const list = groups[tab];

  return (
    <>
      <DashNav lang={lang} current="orders" restaurant={restaurant} restaurants={restaurants} />
      <div className="wrap">
        <div className="kbar">
          <h2>{k("orders")} · {restaurant.name}</h2>
          <button className={`btn sm${sound ? " ok" : ""}`} onClick={enableSound}>{sound ? k("soundOn") : k("soundOff")}</button>
        </div>
        {offline && <p className="note">{k("offline")}</p>}
        <div className="tabs" role="tablist" style={{ marginBottom: 14 }}>
          {(["pending", "active", "done"] as const).map((x) => (
            <button key={x} role="tab" aria-selected={tab === x} onClick={() => setTab(x)}>
              {k(x === "pending" ? "tPending" : x === "active" ? "tActive" : "tDone")} <span className="num">({groups[x].length})</span>
            </button>
          ))}
        </div>
        {!loaded ? <p className="empty">…</p> : !list.length ? <p className="empty">{k("noOrders")}</p> : (
          <div className="orders">{list.map((o) => {
            const left = o.respondBy ? new Date(o.respondBy).getTime() - now : 0;
            const queued = o.status === "PENDING" && left > 4 * 60000;
            return (
              <article key={o.id} className={`card order${o.status === "PENDING" && !queued ? " new" : ""}`}>
                <div className="oh">
                  <span className="oid num">#{o.number}</span>
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
                <Actions o={o} k={k} t={t} act={act} />
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

function Actions({ o, k, t, act }: { o: Order; k: (s: string) => string; t: (s: string) => string; act: (o: Order, b: Record<string, unknown>) => void }) {
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
        <div className="prep">{[10, 15, 20, 30, 45, 60].map((m) => <button key={m} className="num" onClick={() => act(o, { action: "accept", prepMin: m })}>{m}</button>)}</div>
        <div style={{ display: "flex", gap: 8 }}>{reasonSelect}<button className="btn sm ghost" onClick={() => act(o, { action: "reject", reason })}>{k("reject")}</button></div>
      </div>
    );
  }
  if (o.status === "ACCEPTED" || o.status === "READY") {
    return (
      <div style={{ display: "grid", gap: 8 }}>
        {o.readyAt && <div className="small">{t("readyAt")} <b className="num">{new Date(o.readyAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</b></div>}
        {o.status === "ACCEPTED"
          ? <button className="btn ok block" onClick={() => act(o, { action: "ready" })}>{k("markReady")}</button>
          : <button className="btn block" onClick={() => act(o, { action: "complete" })}>{k("complete")}</button>}
        <div style={{ display: "flex", gap: 8 }}>{reasonSelect}<button className="btn sm ghost" onClick={() => act(o, { action: "cancel", reason })}>{k("cancel")}</button></div>
      </div>
    );
  }
  return o.rejectReason ? <div className="small muted">{k("reason")}: {t(o.rejectReason)}</div> : null;
}
