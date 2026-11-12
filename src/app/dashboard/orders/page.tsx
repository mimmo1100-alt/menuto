import { dashContext } from "@/lib/dash-page";
import KitchenBoard from "@/components/KitchenBoard";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ r?: string }> }) {
  const { restaurants, current, user } = await dashContext((await searchParams).r, { allowStaff: true });
  if (!current) return <div className="wrap"><p className="empty">Nessun ristorante collegato a questo account.</p></div>;
  return <KitchenBoard isPartner={user.role === "PARTNER"} staff={user.role === "STAFF"} restaurant={current} restaurants={restaurants} />;
}
