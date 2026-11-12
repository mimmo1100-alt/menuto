"use client";

import { useEffect, useState } from "react";
import { LANGS, LOCALE, money, pickLang, t as tt, tr, type Lang } from "@/lib/i18n";

type O = {
  id: string; number: number; status: string; type: string; asap: boolean; fulfillAt: string | null; readyAt: string | null; rejectReason: string | null;
  payment: string; subtotal: number; discount: number; deliveryFee: number; tax: number; total: number;
  items: { name: Record<string, string>; sizeName: Record<string, string> | null; qty: number; options: { name: Record<string, string> }[]; total: number }[];
  restaurant: { name: string; slug: string; currency: string; taxIncluded: boolean; taxName: string };
};

export default function OrderTracker({ slug, id, initialLang }: { slug: string; id: string; initialLang: Lang }) {
  const [lang, setLang] = useState<Lang>(initialLang);
  const [o, setO] = useState<O | null>(null);
  const [gone, setGone] = useState(false);
  const t = (k: string) => tt(lang, k);

  useEffect(() => {
    let saved: string | null = null;
    try { saved = JSON.parse(localStorage.getItem("menuto.lang") ?? "null"); } catch { /* ignore */ }
    const l = saved && (LANGS as readonly string[]).includes(saved) ? (saved as Lang) : pickLang(navigator.languages, initialLang);
    setLang(l); document.documentElement.lang = l; document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
  }, [initialLang]);

  useEffect(() => {
    let stop = false;
    const tick = async () => {
      try {
        const res = await fetch(`/api/orders/${id}`, { cache: "no-store" });
        if (res.status === 404) { setGone(true); return; }
        const j = (await res.json()) as O;
        if (!stop) setO(j);
        if (["COMPLETED", "REJECTED", "MISSED", "CANCELED"].includes(j.status)) return;
      } catch { /* retry */ }
      if (!stop) setTimeout(tick, 3000);
    };
    tick();
    return () => { stop = true; };
  }, [id]);

  if (gone) return <div className="wrap"><div className="track"><p className="empty">404</p></div></div>;
  if (!o) return <div className="wrap"><div className="track"><p className="empty">…</p></div></div>;

  const cur = o.restaurant.currency;
  const fmtTime = (iso: string) => new Date(iso).toLocaleString(LOCALE[lang], { weekday: "short", hour: "2-digit", minute: "2-digit" });
  const step = ({ PENDING: 1, ACCEPTED: 2, READY: 3, COMPLETED: 3 } as Record<string, number>)[o.status] ?? 0;
  const failed = ["REJECTED", "MISSED", "CANCELED"].includes(o.status);

  return (
    <div className="wrap"><div className="track">
      <span className="muted">{t("orderNo")} <b className="num">#{o.number}</b> · {o.restaurant.name}</span>
      <div className="big" role="status">{t(o.status)}</div>
      {o.status === "PENDING" && <div className="muted">{t("pendingSub")}</div>}
      {o.status === "ACCEPTED" && o.readyAt && <div className="muted">{t("readyAt")} <span className="num">{fmtTime(o.readyAt)}</span></div>}
      {(o.status === "REJECTED" || o.status === "CANCELED") && o.rejectReason && <div className="note">{t(o.rejectReason)}</div>}
      {!failed && <div className="prog"><i className={step >= 1 ? "on" : ""} /><i className={step >= 2 ? "on" : ""} /><i className={step >= 3 ? "on" : ""} /></div>}
      <div className="card order">
        <ul>{o.items.map((l, i) => (
          <li key={i}><span className="q num">{l.qty}×</span>
            <span style={{ flex: 1 }}>{tr(l.name, lang)}<span className="o">{[l.sizeName && tr(l.sizeName, lang), ...l.options.map((x) => tr(x.name, lang))].filter(Boolean).join(lang === "ar" ? "، " : ", ")}</span></span>
            <span className="num">{money(l.total, lang, cur)}</span></li>
        ))}</ul>
        <div className="totals num">
          {o.discount > 0 && <div><span>{t("discount")}</span><span>−{money(o.discount, lang, cur)}</span></div>}
          {o.type === "DELIVERY" && <div><span>{t("deliveryFee")}</span><span>{money(o.deliveryFee, lang, cur)}</span></div>}
          <div className="grand"><span>{t("total")}</span><span>{money(o.total, lang, cur)}</span></div>
        </div>
        <div className="meta"><span>{t(o.type)} · {o.asap ? t("asap") : o.fulfillAt ? fmtTime(o.fulfillAt) : ""}</span><span>{t(o.payment)}</span></div>
      </div>
      {failed ? <a className="btn" href={`/r/${slug}?retry=1`}>{t("tryAgain")}</a> : <a className="btn ghost" href={`/r/${slug}`}>{t("backToMenu")}</a>}
    </div></div>
  );
}
