import { db } from "@/lib/db";
import { dashContext } from "@/lib/dash-page";
import { localParts } from "@/lib/time";
import ReportsPage from "@/components/ReportsPage";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ r?: string }> }) {
  const { restaurants, current, user } = await dashContext((await searchParams).r);
  if (!current) return <div className="wrap"><p className="empty">Nessun ristorante collegato a questo account.</p></div>;
  if (user.role === "STAFF") return <div className="wrap"><p className="empty">I rapporti sono visibili solo al titolare.</p></div>;
  const { timezone } = await db.restaurant.findUniqueOrThrow({ where: { id: current.id }, select: { timezone: true } });
  return <ReportsPage isPartner={user.role === "PARTNER"} restaurant={current} restaurants={restaurants} today={localParts(new Date(), timezone).ymd} />;
}
