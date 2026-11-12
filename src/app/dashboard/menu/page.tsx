import { dashContext } from "@/lib/dash-page";
import { loadMenuEdit } from "@/lib/menu-edit";
import MenuEditor from "@/components/MenuEditor";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ r?: string }> }) {
  const { restaurants, current } = await dashContext((await searchParams).r);
  if (!current) return <div className="wrap"><p className="empty">Nessun ristorante collegato a questo account.</p></div>;
  return <MenuEditor restaurant={current} restaurants={restaurants} initial={await loadMenuEdit(current.id)} />;
}
