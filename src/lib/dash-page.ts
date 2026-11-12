import { redirect } from "next/navigation";
import { db } from "./db";
import { currentUser, restaurantIdsFor } from "./auth";

/**
 * Shared loader for dashboard pages: the signed-in user, their restaurants and the selected one.
 * Staff accounts only see the orders and team pages; other pages send them to the orders.
 */
export async function dashContext(r?: string, opts: { allowStaff?: boolean } = {}) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role === "STAFF" && !opts.allowStaff) redirect(`/dashboard/orders${r ? `?r=${r}` : ""}`);
  const ids = await restaurantIdsFor(user);
  const restaurants = await db.restaurant.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, slug: true, currency: true }, orderBy: { name: "asc" } });
  const current = restaurants.find((x) => x.id === r) ?? restaurants[0] ?? null;
  return { user, restaurants, current };
}
