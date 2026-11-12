import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { currentUser, restaurantIdsFor } from "@/lib/auth";
import KitchenBoard from "@/components/KitchenBoard";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ r?: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const ids = await restaurantIdsFor(user);
  const restaurants = await db.restaurant.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, slug: true, currency: true }, orderBy: { name: "asc" } });
  if (!restaurants.length) return <div className="wrap"><p className="empty">Nessun ristorante collegato a questo account.</p></div>;
  const { r } = await searchParams;
  const current = restaurants.find((x) => x.id === r) ?? restaurants[0];
  return <KitchenBoard restaurant={current} restaurants={restaurants} />;
}
