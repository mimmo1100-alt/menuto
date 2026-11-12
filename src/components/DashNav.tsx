"use client";

import type { Lang } from "@/lib/i18n";

export const DASH: Record<Lang, Record<string, string>> = {
  it: { orders: "Ordini", menu: "Menu", settings: "Impostazioni", publish: "Pubblica", partner: "Partner", menuPage: "Pagina menu", logout: "Esci" },
  en: { orders: "Orders", menu: "Menu", settings: "Settings", publish: "Publish", partner: "Partner", menuPage: "Menu page", logout: "Log out" },
  ar: { orders: "الطلبات", menu: "المنيو", settings: "الإعدادات", publish: "النشر", partner: "لوحة الشريك", menuPage: "صفحة المنيو", logout: "خروج" },
};

type R = { id: string; name: string; slug: string };

export default function DashNav({ lang, current, restaurant, restaurants, isPartner = false }: { lang: Lang; current: "orders" | "menu" | "settings" | "publish" | "partner"; restaurant: R | null; restaurants: R[]; isPartner?: boolean }) {
  const k = (s: string) => DASH[lang][s] ?? s;
  const href = (p: string) => (restaurant ? `/dashboard/${p}?r=${restaurant.id}` : `/dashboard/${p}`);
  return (
    <div className="dash-top"><div className="wrap">
      <b>Menuto</b>
      {isPartner && <a href="/dashboard/partner" aria-current={current === "partner" ? "page" : undefined}>{k("partner")}</a>}
      {restaurant && (["orders", "menu", "settings", "publish"] as const).map((p) => (
        <a key={p} href={href(p)} aria-current={current === p ? "page" : undefined}>{k(p)}</a>
      ))}
      {restaurant && <a href={`/r/${restaurant.slug}`} target="_blank" rel="noreferrer">{k("menuPage")}</a>}
      <span className="sp" />
      {restaurant && restaurants.length > 1 && (
        <select className="langsel" value={restaurant.id} aria-label="Restaurant" onChange={(e) => (location.href = `/dashboard/${current}?r=${e.target.value}`)}>
          {restaurants.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      )}
      <button onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); location.href = "/login"; }}>{k("logout")}</button>
    </div></div>
  );
}
