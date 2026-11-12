import { dashContext } from "@/lib/dash-page";
import { loadSettings } from "@/lib/settings-edit";
import SettingsEditor from "@/components/SettingsEditor";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ r?: string }> }) {
  const { restaurants, current } = await dashContext((await searchParams).r);
  if (!current) return <div className="wrap"><p className="empty">Nessun ristorante collegato a questo account.</p></div>;
  return <SettingsEditor restaurant={current} restaurants={restaurants} initial={await loadSettings(current.id)} />;
}
