import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { ServiceType } from "@prisma/client";
import { loadRestaurant, publicMenu } from "@/lib/menu";
import { anyOpenNow, asapAllowed, isPaused, slots } from "@/lib/availability";
import { pickLang } from "@/lib/i18n";
import { localParts } from "@/lib/time";
import OrderApp, { type PageData } from "@/components/OrderApp";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const r = await loadRestaurant(slug);
  return { title: r ? `${r.name} · Menu` : "Menu" };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const r = await loadRestaurant(slug);
  if (!r) notFound();
  const now = new Date();
  const svc = r.services as ServiceType[];
  const data: PageData = {
    restaurant: {
      slug: r.slug, name: r.name, address: `${r.address}, ${r.postcode ?? ""} ${r.city}`.replace(/\s+/g, " ").trim(), phone: r.phone,
      currency: r.currency, coverImage: r.coverImage, imprint: r.partner?.imprint ?? null,
      taxIncluded: r.taxIncluded, taxName: r.taxName, taxRateBp: r.taxRateBp,
      services: svc, payments: r.payments as Record<string, string[]>,
      zones: r.zones.map((z) => ({ id: z.id, name: z.name, minOrder: z.minOrder, fee: z.fee })),
      hours: r.hours.map((h) => ({ days: h.days, from: h.from, to: h.to, service: h.service })),
      accepting: r.acceptingOrders,
      paused: svc.every((s) => isPaused(r, s, now)) ? (r.pauseMessage || "") : null,
      openNow: anyOpenNow(r, now),
      asap: Object.fromEntries(svc.map((s) => [s, asapAllowed(r, s, now)])),
      slots: Object.fromEntries(svc.map((s) => [s, slots(r, s, now)])),
      todayYmd: localParts(now, r.timezone).ymd,
    },
    menu: publicMenu(r, now),
    initialLang: pickLang((await headers()).get("accept-language"), (r.defaultLang as "it") ?? "it"),
  };
  return <OrderApp data={data} />;
}
