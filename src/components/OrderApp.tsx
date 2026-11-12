"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { PubCategory, PubItem } from "@/lib/menu";
import type { DaySlots } from "@/lib/availability";
import MapPicker, { geocode, type LatLng, type MapZone } from "./MapPicker";
import { zoneFor } from "@/lib/geo";
import { DAYKEYS, LANGS, money as fmtMoney, pickLang, t as tt, tr, type Lang } from "@/lib/i18n";

type Svc = "PICKUP" | "DELIVERY" | "DINEIN";
export type PageData = {
  restaurant: {
    slug: string; name: string; address: string; phone: string; currency: string; coverImage: string | null; imprint: string | null;
    taxIncluded: boolean; taxName: string; taxRateBp: number;
    services: Svc[]; payments: Record<string, string[]>;
    zones: (MapZone & { minOrder: number; fee: number })[];
    center: LatLng; allowOutside: boolean;
    hours: { days: number[]; from: string; to: string; service: string | null }[];
    accepting: boolean; paused: string | null; openNow: boolean;
    asap: Record<string, boolean>; slots: Record<string, DaySlots[]>; todayYmd: string;
  };
  menu: PubCategory[];
  initialLang: Lang;
};

type Line = { key: string; itemId: string; sizeId: string | null; optionIds: string[]; qty: number; instructions: string };
type Contact = { firstName: string; lastName: string; email: string; phone: string; marketingOk: boolean };
type Address = { street: string; city: string; more: string };
type When = { asap: true } | { asap: false; ymd: string; time: string };
type Step = "contact" | "type" | "time" | "pay";
const STEPS: Step[] = ["contact", "type", "time", "pay"];
type Totals = { subtotal: number; discount: number; deliveryFee: number; tax: number; total: number; couponCode: string | null };

const LANG_NAMES: Record<Lang, string> = { it: "Italiano", en: "English", ar: "العربية" };

function load<T>(k: string, d: T): T { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : d; } catch { return d; } }
function save(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } }

export default function OrderApp({ data }: { data: PageData }) {
  const R = data.restaurant;
  const router = useRouter();
  const [lang, setLang] = useState<Lang>(data.initialLang);
  const [screen, setScreen] = useState<"landing" | "menu" | "info" | "checkout">("landing");
  const [cart, setCart] = useState<Line[]>([]);
  const [sheet, setSheet] = useState<{ item: PubItem; sizeId: string | null; sel: Record<string, string[]>; qty: number; instructions: string; err: string } | null>(null);
  const [contact, setContact] = useState<Contact | null>(null);
  const [type, setType] = useState<Svc | null>(null);
  const [address, setAddress] = useState<Address | null>(null);
  const [pin, setPin] = useState<LatLng | null>(null);
  const [when, setWhen] = useState<When | null>(null);
  const [pay, setPay] = useState<string | null>(null);
  const [editing, setEditing] = useState<Step | null>("contact");
  const [stepErr, setStepErr] = useState("");
  const [comments, setComments] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<string | null>(null);
  const [couponMsg, setCouponMsg] = useState("");
  const [serverTotals, setServerTotals] = useState<Totals | null>(null);
  const [placeErr, setPlaceErr] = useState("");
  const [sending, setSending] = useState(false);

  const t = (k: string, v?: Record<string, string | number>) => tt(lang, k, v);
  const money = (c: number) => fmtMoney(c, lang, R.currency);
  const cartKey = `menuto.cart.${R.slug}`;

  // language: device language unless the visitor picked one; restore cart and contact
  useEffect(() => {
    const saved = load<Lang | null>("menuto.lang", null);
    setLang(saved && LANGS.includes(saved) ? saved : pickLang(navigator.languages, data.initialLang));
    const retry = new URLSearchParams(window.location.search).get("retry") === "1";
    setCart(retry ? load<Line[]>(`${cartKey}.last`, []) : load<Line[]>(cartKey, []));
    if (retry) setScreen("checkout");
    const c = load<Contact | null>("menuto.contact", null);
    if (c) { setContact(c); }
  }, [cartKey, data.initialLang]);
  useEffect(() => { document.documentElement.lang = lang; document.documentElement.dir = lang === "ar" ? "rtl" : "ltr"; }, [lang]);
  useEffect(() => { save(cartKey, cart); }, [cart, cartKey]);

  const items = useMemo(() => {
    const m = new Map<string, PubItem>();
    data.menu.forEach((c) => c.items.forEach((i) => m.set(i.id, i)));
    return m;
  }, [data.menu]);

  // drop lines whose item vanished or sold out since they were added
  const validCart = cart.filter((l) => { const i = items.get(l.itemId); return i && !i.soldOut; });

  function lineUnit(l: Line) {
    const item = items.get(l.itemId)!;
    let p = item.sizes.length ? item.sizes.find((s) => s.id === l.sizeId)?.price ?? 0 : item.price;
    for (const g of item.groups) for (const o of g.options) if (l.optionIds.includes(o.id)) p += o.price;
    return p;
  }
  function lineLabel(l: Line) {
    const item = items.get(l.itemId)!;
    const parts: string[] = [];
    if (l.sizeId) parts.push(tr(item.sizes.find((s) => s.id === l.sizeId)?.name, lang));
    for (const g of item.groups) for (const o of g.options) if (l.optionIds.includes(o.id)) parts.push(tr(o.name, lang));
    return parts.join(lang === "ar" ? "، " : ", ");
  }
  const subtotal = validCart.reduce((a, l) => a + lineUnit(l) * l.qty, 0);
  const count = validCart.reduce((a, l) => a + l.qty, 0);
  const zone = pin ? zoneFor(R.zones, pin.lat, pin.lng) : null;
  const minOrder = type === "DELIVERY" && zone ? zone.minOrder : 0;

  // server quote (authoritative totals, validates coupon) while on checkout
  const quoteBody = JSON.stringify({ lines: validCart.map(({ itemId, sizeId, optionIds, qty }) => ({ itemId, sizeId, optionIds, qty })), type: type ?? R.services[0], location: type === "DELIVERY" ? pin : null, coupon: coupon ?? undefined });
  useEffect(() => {
    if (screen !== "checkout" || !validCart.length) return;
    const ac = new AbortController();
    fetch(`/api/r/${R.slug}/quote`, { method: "POST", body: quoteBody, headers: { "content-type": "application/json" }, signal: ac.signal })
      .then(async (res) => {
        const j = await res.json();
        if (res.ok) setServerTotals(j);
        else { setServerTotals(null); if (j.error === "coupon" && coupon) { setCoupon(null); setCouponMsg(t("couponBad")); } }
      })
      .catch(() => {});
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteBody, screen]);

  const totals: Totals = serverTotals ?? { subtotal, discount: 0, deliveryFee: zone && type === "DELIVERY" ? zone.fee : 0, tax: 0, total: subtotal + (zone && type === "DELIVERY" ? zone.fee : 0), couponCode: null };

  const stepDone = (s: Step) =>
    s === "contact" ? !!contact : s === "type" ? !!type && (type !== "DELIVERY" || (!!address && (!R.zones.length || (!!pin && (!!zone || R.allowOutside))))) : s === "time" ? !!when : !!pay;

  function go(s: typeof screen) {
    setScreen(s); setSheet(null);
    if (s === "checkout") setEditing(STEPS.find((x) => !stepDone(x)) ?? null);
    window.scrollTo(0, 0);
  }

  function openItem(item: PubItem) {
    if (item.soldOut) return;
    const sel: Record<string, string[]> = {};
    for (const g of item.groups) sel[g.id] = g.options.filter((o) => o.preselected && !o.soldOut).map((o) => o.id);
    setSheet({ item, sizeId: item.sizes.find((s) => s.preselected)?.id ?? item.sizes[0]?.id ?? null, sel, qty: 1, instructions: "", err: "" });
  }
  function toggleOpt(gid: string, oid: string) {
    if (!sheet) return;
    const g = sheet.item.groups.find((x) => x.id === gid)!;
    const cur = sheet.sel[gid] ?? [];
    const single = g.max === 1;
    let next = cur.includes(oid) ? cur.filter((x) => x !== oid) : single ? [oid] : [...cur, oid];
    if (!single && g.max > 0 && next.length > g.max) next = cur;
    setSheet({ ...sheet, sel: { ...sheet.sel, [gid]: next }, err: "" });
  }
  function addToCart() {
    if (!sheet) return;
    for (const g of sheet.item.groups) {
      const n = (sheet.sel[g.id] ?? []).length;
      const min = Math.max(g.min, g.required ? 1 : 0);
      if (n < min) { setSheet({ ...sheet, err: `${tr(g.name, lang)}: ${min === 1 ? t("chooseOne") : t("chooseAtLeast", { n: min })}` }); return; }
    }
    const optionIds = Object.values(sheet.sel).flat().sort();
    const key = `${sheet.item.id}|${sheet.sizeId}|${optionIds.join(",")}|${sheet.instructions.trim()}`;
    setCart((c) => {
      const ex = c.find((l) => l.key === key);
      return ex ? c.map((l) => (l === ex ? { ...l, qty: l.qty + sheet.qty } : l))
        : [...c, { key, itemId: sheet.item.id, sizeId: sheet.sizeId, optionIds, qty: sheet.qty, instructions: sheet.instructions.trim() }];
    });
    setSheet(null);
  }
  function changeQty(key: string, d: number) {
    setCart((c) => c.map((l) => (l.key === key ? { ...l, qty: l.qty + d } : l)).filter((l) => l.qty > 0));
  }

  function submitStep(s: Step, fd: FormData) {
    setStepErr("");
    const v = (k: string) => String(fd.get(k) ?? "").trim();
    if (s === "contact") {
      const c = { firstName: v("firstName"), lastName: v("lastName"), email: v("email"), phone: v("phone"), marketingOk: fd.get("mkt") === "on" };
      if (!c.firstName || !c.lastName || !/^\S+@\S+\.\S+$/.test(c.email) || c.phone.replace(/\D/g, "").length < 6) return setStepErr(t("fillRequired"));
      setContact(c); save("menuto.contact", c);
    }
    const cleared = new Set<Step>();
    if (s === "type") {
      const ty = v("type") as Svc;
      if (ty === "DELIVERY") {
        const a = { street: v("street"), city: v("city"), more: v("more") };
        const lat = Number(fd.get("lat")), lng = Number(fd.get("lng"));
        const loc = Number.isFinite(lat) && Number.isFinite(lng) && fd.get("lat") ? { lat, lng } : null;
        if (!a.street || !a.city) return setStepErr(t("fillRequired"));
        if (R.zones.length && (!loc || (!zoneFor(R.zones, loc.lat, loc.lng) && !R.allowOutside))) return setStepErr(t("outsideArea"));
        setAddress(a); setPin(loc);
      }
      setType(ty);
      if (pay && !(R.payments[ty] ?? []).includes(pay)) { setPay(null); cleared.add("pay"); }
      if (when && (when.asap ? !R.asap[ty] : !(R.slots[ty] ?? []).some((d) => d.ymd === when.ymd && d.times.includes(when.time)))) { setWhen(null); cleared.add("time"); }
    } else if (s === "time") {
      const tm = v("time");
      if (!tm) return setStepErr(t("noSlots"));
      setWhen(tm === "asap" ? { asap: true } : { asap: false, ymd: v("day"), time: tm });
    } else if (s === "pay") {
      if (!v("pay")) return setStepErr(t("fillRequired"));
      setPay(v("pay"));
    }
    // move to the next unfinished step (state updates are async, so compute from the step order)
    const idx = STEPS.indexOf(s);
    setEditing(STEPS.slice(idx + 1).find((x) => cleared.has(x) || !stepDone(x)) ?? null);
  }

  async function place() {
    if (!contact || !type || !when || !pay) return;
    setSending(true); setPlaceErr("");
    try {
      const res = await fetch(`/api/r/${R.slug}/orders`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          lines: validCart.map(({ itemId, sizeId, optionIds, qty, instructions }) => ({ itemId, sizeId, optionIds, qty, instructions: instructions || undefined })),
          type, when, customer: contact, address: type === "DELIVERY" ? address : null, location: type === "DELIVERY" ? pin : null, payment: pay,
          comments: comments || undefined, coupon: coupon ?? undefined, lang,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setPlaceErr(t(j.error === "closed" ? "errClosed" : j.error === "item" ? "errItem" : j.error === "min" ? "errMin" : "errGeneric"));
        setSending(false); return;
      }
      save(`${cartKey}.last`, validCart);
      setCart([]); save(cartKey, []);
      router.push(`/r/${R.slug}/o/${j.id}`);
    } catch {
      setPlaceErr(t("errGeneric")); setSending(false);
    }
  }

  const statusPill = !R.accepting ? <span className="pill bad"><span className="dot" />{t("notAccepting")}</span>
    : R.paused !== null ? <span className="pill bad"><span className="dot" />{t("paused")}{R.paused ? ` · ${R.paused}` : ""}</span>
    : R.openNow ? <span className="pill ok"><span className="dot" />{t("openNow")}</span>
    : <span className="pill warn"><span className="dot" />{Object.values(R.slots).some((d) => d.length) ? t("closedNow") : t("closedNoPre")}</span>;

  const canOrder = R.accepting && R.services.some((s) => R.asap[s] || (R.slots[s] ?? []).length > 0);

  const header = (
    <div className="top"><div className="wrap">
      <h1>{R.name}</h1>
      <button className="iconbtn" aria-label={t("menu")} aria-pressed={screen === "menu"} onClick={() => go("menu")}><Icon name="menu" /></button>
      <button className="iconbtn" aria-label={t("info")} aria-pressed={screen === "info"} onClick={() => go("info")}><Icon name="info" /></button>
      <button className="iconbtn" aria-label={t("cart")} aria-pressed={screen === "checkout"} onClick={() => go("checkout")}><Icon name="cart" />{count > 0 && <span className="badge num">{count}</span>}</button>
    </div></div>
  );
  const langSelect = (
    <select className="langsel" aria-label={t("languages")} value={lang} onChange={(e) => { const l = e.target.value as Lang; setLang(l); save("menuto.lang", l); }}>
      {LANGS.map((l) => <option key={l} value={l}>{LANG_NAMES[l]}</option>)}
    </select>
  );
  const imprint = R.imprint ? <div className="imprint">{R.imprint}</div> : null;

  const cartBox = (withBtn: boolean) => !validCart.length ? (
    <><h3 style={{ fontSize: 18 }}>{t("cart")}</h3><p className="muted">{t("cartEmpty")}</p></>
  ) : (
    <>
      <h3 style={{ fontSize: 18 }}>{t("cart")}</h3>
      {validCart.map((l) => {
        const item = items.get(l.itemId)!;
        const label = lineLabel(l);
        return (
          <div className="cartline" key={l.key}>
            <span className="qty"><button aria-label="-" onClick={() => changeQty(l.key, -1)}>−</button><span className="num">{l.qty}</span><button aria-label="+" onClick={() => changeQty(l.key, 1)}>+</button></span>
            <span style={{ fontWeight: 600, alignSelf: "center" }}>{tr(item.name, lang)}</span>
            <span className="num" style={{ alignSelf: "center" }}>{money(lineUnit(l) * l.qty)}</span>
            {(label || l.instructions) && <span className="opts">{[label, l.instructions && `“${l.instructions}”`].filter(Boolean).join(" · ")}</span>}
          </div>
        );
      })}
      <div className="totals num">
        <div><span>{t("subtotal")}</span><span>{money(totals.subtotal)}</span></div>
        {totals.discount > 0 && <div><span>{t("discount")}{totals.couponCode ? ` (${totals.couponCode})` : ""}</span><span>−{money(totals.discount)}</span></div>}
        {type === "DELIVERY" && <div><span>{t("deliveryFee")}</span><span>{money(totals.deliveryFee)}</span></div>}
        {!R.taxIncluded && totals.tax > 0 && <div><span>{t("taxAdded", { name: R.taxName })}</span><span>{money(totals.tax)}</span></div>}
        <div className="grand"><span>{t("total")}</span><span>{money(totals.total)}</span></div>
        {R.taxIncluded && totals.tax > 0 && <div className="small muted"><span>{t("tax", { name: R.taxName })}</span><span>{money(totals.tax)}</span></div>}
      </div>
      {withBtn && <button className="btn block" style={{ marginTop: 12 }} onClick={() => go("checkout")}>{t("checkout")}</button>}
    </>
  );

  if (screen === "landing") {
    return (
      <div className="wrap">
        <section className="hero">
          <div style={{ display: "flex", width: "100%", justifyContent: "flex-end" }}>{langSelect}</div>
          <h2>{R.name}</h2>
          {statusPill}
          <p>{R.address}</p>
          <button className="btn" disabled={!canOrder} onClick={() => go("menu")}>{R.openNow ? t("seeMenu") : t("seeMenuAhead")}</button>
          {R.zones.length > 0 && <div className="facts num">{R.zones.map((z) => <span key={z.id}>{z.name}: {t("min")} {money(z.minOrder)} · {t("fee")} {money(z.fee)}</span>)}</div>}
        </section>
        {imprint}
      </div>
    );
  }

  let main: React.ReactNode = null;
  if (screen === "menu") {
    main = (
      <div className="wrap"><div className="layout"><div style={{ minWidth: 0 }}>
        {!R.openNow && <div style={{ marginTop: 4 }}>{statusPill}</div>}
        <nav className="cats" aria-label={t("menu")}>
          {data.menu.map((c) => <a key={c.id} href={`#cat-${c.id}`} onClick={(e) => { e.preventDefault(); document.getElementById(`cat-${c.id}`)?.scrollIntoView({ behavior: "smooth" }); }}>{tr(c.name, lang)}</a>)}
        </nav>
        {data.menu.map((c) => (
          <section className="cat" id={`cat-${c.id}`} key={c.id}>
            <h2>{tr(c.name, lang)}</h2>
            {c.desc && tr(c.desc, lang) && <p className="muted">{tr(c.desc, lang)}</p>}
            <div className="items">
              {c.items.map((it) => {
                const from = it.sizes.length ? Math.min(...it.sizes.map((s) => s.price)) : it.price;
                return (
                  <button className={`item${it.soldOut ? " sold" : ""}`} key={it.id} onClick={() => openItem(it)} disabled={it.soldOut}>
                    <span style={{ minWidth: 0 }}>
                      <span className="iname">{tr(it.name, lang)}</span>
                      {it.desc && tr(it.desc, lang) && <span className="idesc" style={{ display: "block" }}>{tr(it.desc, lang)}</span>}
                      {(it.labels.length > 0 || it.soldOut) && <span className="labels">{it.soldOut && <span>{t("soldOut")}</span>}{it.labels.map((l) => <span key={l}>{t(l)}</span>)}</span>}
                    </span>
                    <span style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      {from > 0 && <span className="price num">{money(from)}</span>}
                      <span className="plus" aria-hidden="true">+</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
        {imprint}
      </div>
      <aside className="side"><div className="card">{cartBox(true)}</div></aside></div></div>
    );
  } else if (screen === "info") {
    main = (
      <div className="wrap"><div className="info">
        <div className="card"><h3>{R.name}</h3><div style={{ marginTop: 8 }}>{statusPill}</div>
          <dl><dt>{t("address")}</dt><dd>{R.address}</dd><dt>{t("phone")}</dt><dd className="num" style={{ userSelect: "all" }}>{R.phone}</dd></dl>
          <div style={{ marginTop: 12 }}>{langSelect}</div>
        </div>
        <div className="card"><h3>{t("hours")}</h3><dl>
          {R.hours.map((h, i) => <FragmentRow key={i} dt={`${h.service ? t(h.service) + " · " : ""}${h.days.map((d) => t(DAYKEYS[d])).join(", ")}`} dd={`${h.from} – ${h.to}`} />)}
        </dl></div>
        {R.zones.length > 0 && <div className="card"><h3>{t("deliveryZones")}</h3><dl className="num">
          {R.zones.map((z) => <FragmentRow key={z.id} dt={z.name} dd={`${t("min")} ${money(z.minOrder)} · ${t("fee")} ${money(z.fee)}`} />)}
        </dl></div>}
        <div className="card"><h3>{t("payMethods")}</h3><dl>
          {R.services.map((s) => <FragmentRow key={s} dt={t(s)} dd={(R.payments[s] ?? []).map((p) => t(p)).join(", ")} />)}
        </dl></div>
        {imprint}
      </div></div>
    );
  } else {
    // checkout
    if (!validCart.length) {
      main = <div className="wrap"><div className="track"><p className="empty">{t("cartEmpty")}</p><button className="btn" onClick={() => go("menu")}>{t("backToMenu")}</button></div></div>;
    } else {
      const titles: Record<Step, string> = { contact: t("contact"), type: t("orderType"), time: t("time"), pay: t("payment") };
      const firstOpen = STEPS.find((x) => !stepDone(x));
      const ready = STEPS.every(stepDone) && !editing;
      const minOk = subtotal >= minOrder;
      main = (
        <div className="wrap"><div className="co">
          <div style={{ minWidth: 0, display: "grid", gap: 14 }}>
            <div className="steps">
              {STEPS.map((s, i) => {
                const done = stepDone(s), isEd = editing === s;
                const locked = !done && !isEd && firstOpen !== undefined && STEPS.indexOf(firstOpen) < i;
                return (
                  <div key={s} className={`step${done && !isEd ? " done" : ""}${locked ? " locked" : ""}`}>
                    <h3><span className="n num">{done && !isEd ? "✓" : i + 1}</span>{titles[s]}</h3>
                    {isEd ? (
                      <StepForm step={s} lang={lang} R={R} contact={contact} type={type} address={address} location={pin} when={when} pay={pay} err={stepErr}
                        onSubmit={(fd) => submitStep(s, fd)} money={money} />
                    ) : done ? (
                      <div className="sum"><div>{summary(s)}</div><button className="link" onClick={() => { setEditing(s); setStepErr(""); }}>{t("change")}</button></div>
                    ) : !locked ? (
                      <div className="sum"><span /><button className="btn sm ghost" onClick={() => setEditing(s)}>{t("change")}</button></div>
                    ) : null}
                  </div>
                );
              })}
            </div>
            <label className="f" htmlFor="comments">{t("comments")}<textarea id="comments" value={comments} maxLength={500} onChange={(e) => setComments(e.target.value)} /></label>
          </div>
          <div className="card" style={{ padding: 16, display: "grid", gap: 10 }}>
            {cartBox(false)}
            <div style={{ display: "flex", gap: 8 }}>
              <input type="text" id="coupon" placeholder={t("coupon")} value={couponInput} onChange={(e) => setCouponInput(e.target.value)} style={{ flex: 1, minWidth: 0 }} />
              <button className="btn sm ghost" onClick={() => { const c = couponInput.trim().toUpperCase(); setCoupon(c || null); setCouponMsg(c ? t("couponOk") : ""); }}>{t("apply")}</button>
            </div>
            {couponMsg && <p className={`small${coupon ? "" : " err"}`} style={{ margin: 0 }}>{couponMsg}</p>}
            {!minOk && <p className="note num">{t("minOrder")}: {money(minOrder)}</p>}
            {placeErr && <p className="err">{placeErr}</p>}
            <button className="btn block" disabled={!ready || !minOk || sending} onClick={place}>
              <span>{sending ? t("sending") : t(`place${type ?? "PICKUP"}`)}</span> · <span className="num">{money(totals.total)}</span>
            </button>
          </div>
        </div></div>
      );
    }
  }

  function summary(s: Step) {
    if (s === "contact" && contact) return <>{contact.firstName} {contact.lastName}<br /><span className="muted small">{contact.email} · {contact.phone}</span></>;
    if (s === "type" && type) return type === "DELIVERY" && address ? <>{t("DELIVERY")}<br /><span className="muted small">{address.street}, {address.city}{address.more ? ` · ${address.more}` : ""}{zone ? ` · ${zone.name}` : ""}</span></> : t(type);
    if (s === "time" && when) return when.asap ? t("asap") : <>{dayLabel(when.ymd)} · <span className="num">{when.time}</span></>;
    if (s === "pay" && pay) return t(pay);
    return null;
  }
  function dayLabel(ymd: string) {
    const name = new Date(`${ymd}T12:00:00Z`).toLocaleDateString(lang === "ar" ? "ar-EG" : lang === "en" ? "en-GB" : "it-IT", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" });
    return ymd === R.todayYmd ? `${t("today")} · ${name}` : name;
  }

  return (
    <>
      {header}
      {main}
      {screen === "menu" && count > 0 && (
        <div className="floatcart"><button className="btn block" onClick={() => go("checkout")}><span className="num">{count}</span> · {t("checkout")} · <span className="num">{money(subtotal)}</span></button></div>
      )}
      {sheet && (
        <div className="scrim" onClick={(e) => { if (e.target === e.currentTarget) setSheet(null); }} onKeyDown={(e) => { if (e.key === "Escape") setSheet(null); }}>
          <div className="sheet" role="dialog" aria-modal="true" aria-label={tr(sheet.item.name, lang)}>
            <header>
              <div style={{ flex: 1, minWidth: 0 }}><h3>{tr(sheet.item.name, lang)}</h3>{sheet.item.desc && <p className="muted" style={{ margin: "4px 0 0" }}>{tr(sheet.item.desc, lang)}</p>}</div>
              <button className="closex" aria-label="×" onClick={() => setSheet(null)}>×</button>
            </header>
            <div className="body">
              {sheet.item.sizes.length > 0 && (
                <div className="group"><h4>{t("size")} <span className="pill warn">{t("chooseOne")}</span></h4>
                  <div role="radiogroup">{sheet.item.sizes.map((s) => (
                    <button key={s.id} className="opt radio" role="radio" aria-checked={sheet.sizeId === s.id} onClick={() => setSheet({ ...sheet, sizeId: s.id })}>
                      <span className="box" /><span className="on">{tr(s.name, lang)}</span><span className="muted num small">{money(s.price)}</span>
                    </button>))}</div>
                </div>
              )}
              {sheet.item.groups.map((g) => {
                const min = Math.max(g.min, g.required ? 1 : 0);
                const rule = g.max === 1 ? t("chooseOne") : min > 0 && g.max === min ? t("chooseExactly", { n: min }) : g.max > 0 ? t("chooseUpTo", { n: g.max }) : min > 0 ? t("chooseAtLeast", { n: min }) : t("optional");
                const single = g.max === 1;
                return (
                  <div className="group" key={g.id}>
                    <h4>{tr(g.name, lang)} <span className={`pill ${min > 0 ? "warn" : "neutral"}`}>{min > 0 ? `${t("required")} · ${rule}` : rule}</span></h4>
                    <div role={single ? "radiogroup" : "group"}>{g.options.map((o) => {
                      const on = (sheet.sel[g.id] ?? []).includes(o.id);
                      return (
                        <button key={o.id} className={`opt${single ? " radio" : ""}`} role={single ? "radio" : "checkbox"} aria-checked={on} disabled={o.soldOut} onClick={() => toggleOpt(g.id, o.id)}>
                          <span className="box" /><span className="on">{tr(o.name, lang)}{o.soldOut ? ` · ${t("soldOut")}` : ""}</span>{o.price > 0 && <span className="muted num small">+{money(o.price)}</span>}
                        </button>
                      );
                    })}</div>
                  </div>
                );
              })}
              {!sheet.item.hideInstructions && (
                <label className="f" htmlFor="instr" style={{ marginTop: 16 }}>{t("instructions")}<input type="text" id="instr" maxLength={200} value={sheet.instructions} onChange={(e) => setSheet({ ...sheet, instructions: e.target.value })} /></label>
              )}
              {sheet.err && <p className="err" style={{ marginTop: 12 }}>{sheet.err}</p>}
            </div>
            <footer>
              <span className="qty"><button aria-label="-" onClick={() => setSheet({ ...sheet, qty: Math.max(1, sheet.qty - 1) })}>−</button><span className="num">{sheet.qty}</span><button aria-label="+" onClick={() => setSheet({ ...sheet, qty: Math.min(99, sheet.qty + 1) })}>+</button></span>
              <button className="btn" style={{ flex: 1 }} onClick={addToCart}>
                <span className="num">{money(sheetUnit() * sheet.qty)}</span> · {t("add")}
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  );

  function sheetUnit() {
    if (!sheet) return 0;
    const it = sheet.item;
    let p = it.sizes.length ? it.sizes.find((s) => s.id === sheet.sizeId)?.price ?? 0 : it.price;
    for (const g of it.groups) for (const o of g.options) if ((sheet.sel[g.id] ?? []).includes(o.id)) p += o.price;
    return p;
  }
}

function FragmentRow({ dt, dd }: { dt: string; dd: string }) {
  return <><dt>{dt}</dt><dd>{dd}</dd></>;
}

function StepForm(p: {
  step: Step; lang: Lang; R: PageData["restaurant"]; contact: Contact | null; type: Svc | null; address: Address | null; location: LatLng | null;
  when: When | null; pay: string | null; err: string; onSubmit: (fd: FormData) => void; money: (c: number) => string;
}) {
  const t = (k: string, v?: Record<string, string | number>) => tt(p.lang, k, v);
  const [ty, setTy] = useState<Svc>(p.type ?? p.R.services[0]);
  const svc = p.type ?? p.R.services[0];
  const baseDays = p.R.slots[svc] ?? [];
  const days = p.R.asap[svc] && !baseDays.some((d) => d.ymd === p.R.todayYmd) ? [{ ymd: p.R.todayYmd, times: [] as string[] }, ...baseDays] : baseDays;
  const [day, setDay] = useState<string>(p.when && !p.when.asap ? p.when.ymd : days[0]?.ymd ?? "");
  const err = p.err ? <p className="err">{p.err}</p> : null;
  const submit = (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); p.onSubmit(new FormData(e.currentTarget)); };

  if (p.step === "contact") {
    const c = p.contact;
    return (
      <form className="form" noValidate onSubmit={submit}>
        <div className="row2">
          <label className="f" htmlFor="c-first">{t("firstName")} *<input type="text" id="c-first" name="firstName" autoComplete="given-name" defaultValue={c?.firstName} /></label>
          <label className="f" htmlFor="c-last">{t("lastName")} *<input type="text" id="c-last" name="lastName" autoComplete="family-name" defaultValue={c?.lastName} /></label>
          <label className="f" htmlFor="c-email">{t("email")} *<input type="email" id="c-email" name="email" autoComplete="email" defaultValue={c?.email} /></label>
          <label className="f" htmlFor="c-phone">{t("phone")} *<input type="tel" id="c-phone" name="phone" autoComplete="tel" defaultValue={c?.phone} /></label>
        </div>
        <label className="check" htmlFor="c-mkt"><input type="checkbox" id="c-mkt" name="mkt" defaultChecked={c?.marketingOk} /> {t("marketing")}</label>
        {err}<div><button className="btn" type="submit">{t("save")}</button></div>
      </form>
    );
  }
  if (p.step === "type") {
    const a = p.address;
    return (
      <form className="form" noValidate onSubmit={submit}>
        <div className="choice">{p.R.services.map((s) => (
          <label key={s} htmlFor={`t-${s}`}><input type="radio" id={`t-${s}`} name="type" value={s} checked={ty === s} onChange={() => setTy(s)} /> {t(s)}</label>
        ))}</div>
        {ty === "DELIVERY" && (
          <div className="form" style={{ margin: 0 }}>
            <label className="f" htmlFor="a-street">{t("street")} *<input type="text" id="a-street" name="street" autoComplete="address-line1" defaultValue={a?.street} /></label>
            <label className="f" htmlFor="a-city">{t("city")} *<input type="text" id="a-city" name="city" autoComplete="address-level2" defaultValue={a?.city} /></label>
            <label className="f" htmlFor="a-more">{t("more")}<input type="text" id="a-more" name="more" defaultValue={a?.more} /></label>
            {p.R.zones.length > 0 && <DeliveryPin p={p} />}
          </div>
        )}
        {err}<div><button className="btn" type="submit">{t("save")}</button></div>
      </form>
    );
  }
  if (p.step === "time") {
    const asap = p.R.asap[p.type ?? p.R.services[0]];
    const times = days.find((d) => d.ymd === day)?.times ?? [];
    const cur = p.when ? (p.when.asap ? "asap" : p.when.time) : undefined;
    const fmtDay = (ymd: string, i: number) => {
      const d = new Date(`${ymd}T12:00:00Z`);
      const name = d.toLocaleDateString(p.lang === "ar" ? "ar-EG" : p.lang === "en" ? "en-GB" : "it-IT", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" });
      return d.toISOString().slice(0, 10) === p.R.todayYmd && i >= 0 ? `${t("today")} · ${name}` : name;
    };
    if (!asap && !days.length) return <p className="err">{t("noSlots")}</p>;
    return (
      <form className="form" noValidate onSubmit={submit}>
        <div className="row2">
          <label className="f" htmlFor="w-day">{t("day")}
            <select id="w-day" name="day" value={day} onChange={(e) => setDay(e.target.value)}>
              {days.map((d, i) => <option key={d.ymd} value={d.ymd}>{fmtDay(d.ymd, i)}</option>)}
            </select>
          </label>
          <label className="f" htmlFor="w-time">{t("hour")}
            <select id="w-time" name="time" defaultValue={cur} key={day}>
              {asap && day === p.R.todayYmd && <option value="asap">{t("asap")}</option>}
              
              {times.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
          </label>
        </div>
        {err}<div><button className="btn" type="submit">{t("save")}</button></div>
      </form>
    );
  }
  const opts = p.R.payments[p.type ?? p.R.services[0]] ?? [];
  return (
    <form className="form" noValidate onSubmit={submit}>
      <div className="choice">{opts.map((o) => (
        <label key={o} htmlFor={`p-${o}`}><input type="radio" id={`p-${o}`} name="pay" value={o} defaultChecked={p.pay === o} /> {t(o)}</label>
      ))}</div>
      {err}<div><button className="btn" type="submit">{t("save")}</button></div>
    </form>
  );
}

function Icon({ name }: { name: "menu" | "info" | "cart" }) {
  if (name === "menu") return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h10" /></svg>;
  if (name === "info") return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" strokeLinecap="round" /></svg>;
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M3 4h2.5l2.2 11h10.6L20.5 7H6.4" /><circle cx="9" cy="19.5" r="1.4" /><circle cx="17" cy="19.5" r="1.4" /></svg>;
}

function DeliveryPin({ p }: { p: { lang: Lang; R: PageData["restaurant"]; location: LatLng | null; money: (c: number) => string } }) {
  const t = (k: string) => tt(p.lang, k);
  const [loc, setLoc] = useState<LatLng | null>(p.location);
  const [msg, setMsg] = useState("");
  const zone = loc ? zoneFor(p.R.zones, loc.lat, loc.lng) : null;
  async function find() {
    const street = (document.getElementById("a-street") as HTMLInputElement | null)?.value ?? "";
    const city = (document.getElementById("a-city") as HTMLInputElement | null)?.value ?? "";
    if (!street.trim()) return;
    setMsg("…");
    const g = await geocode(`${street}, ${city}`);
    if (g) { setLoc(g); setMsg(""); } else setMsg(t("notFound"));
  }
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div><button type="button" className="btn sm ghost" onClick={find}>{t("findOnMap")}</button></div>
      <MapPicker center={p.R.center} zones={p.R.zones} value={loc} onChange={setLoc} label={t("mapLabel")} />
      <input type="hidden" name="lat" value={loc?.lat ?? ""} />
      <input type="hidden" name="lng" value={loc?.lng ?? ""} />
      <span className="small muted">{msg || t("pinHint")}</span>
      {loc && (zone
        ? <span className="pill ok" style={{ justifySelf: "start" }}>{zone.name} · {t("min")} {p.money(zone.minOrder)} · {t("fee")} {p.money(zone.fee)}</span>
        : <span className={`pill ${p.R.allowOutside ? "warn" : "bad"}`} style={{ justifySelf: "start" }}>{t("outsideArea")}</span>)}
    </div>
  );
}
