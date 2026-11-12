import { headers } from "next/headers";
import { dashContext } from "@/lib/dash-page";
import { loadTables } from "@/lib/tables";
import TablesPage from "@/components/TablesPage";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ r?: string }> }) {
  const { restaurants, current, user } = await dashContext((await searchParams).r);
  if (!current) return <div className="wrap"><p className="empty">Nessun ristorante collegato a questo account.</p></div>;
  if (user.role === "STAFF") return <div className="wrap"><p className="empty">I tavoli si gestiscono dall&apos;account del titolare.</p></div>;
  const h = await headers();
  const origin = process.env.PUBLIC_URL ?? `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  return <TablesPage isPartner={user.role === "PARTNER"} restaurant={current} restaurants={restaurants} origin={origin} initial={await loadTables(current.id)} />;
}
