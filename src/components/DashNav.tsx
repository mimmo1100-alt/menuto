"use client";

import type { Lang } from "@/lib/i18n";

export const DASH: Record<Lang, Record<string, string>> = {
  it: { orders: "Ordini", menu: "Menu", settings: "Impostazioni", publish: "Pubblica", menuPage: "Pagina menu", logout: "Esci" },
  en: { orders: "Orders", menu: "Menu", settings: "Settings", publish: "Publish", menuPage: "Menu page", logout: "Log out" },
  ar: { orders: "الطلبات", menu: "المنيو", settings: "الإعدادات", publish: "النشر", menuPage: "صفحة المنيو", logout: "خروج" },
};

type R = { id: string; name: string; slug: string };

export default function DashNav({ lang, current, restaurant, restaurants }: { lang: Lang; current: "orders" | "menu" | "settings" | "publish"; restaurant: R; restaurants: R[] }) {
  const k = (s: string) => DASH[lang][s] ?? s;
  const href = (p: string) => `/dashboard/${p}?r=${restaurant.id}`;
  return (
    <div className="dash-top"><div className="wrap">
      <b>Menuto</b>
      {(["orders", "menu", "settings", "publish"] as const).map((p) => (
        <a key={p} href={href(p)} aria-current={current === p ? "page" : undefined}>{k(p)}</a>
      ))}
      <a href={`/r/${restaurant.slug}`} target="_blank" rel="noreferrer">{k("menuPage")}</a>
      <span className="sp" />
      {restaurants.length > 1 && (
        <select className="langsel" value={restaurant.id} aria-label="Restaurant" onChange={(e) => (location.href = `/dashboard/${current}?r=${e.target.value}`)}>
          {restaurants.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      )}
      <button onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); location.href = "/login"; }}>{k("logout")}</button>
    </div></div>
  );
}
