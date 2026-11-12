import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { db } from "./db";

const COOKIE = "menuto_session";
const DAYS = 30;

export async function createSession(userId: string) {
  const id = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + DAYS * 864e5);
  await db.session.create({ data: { id, userId, expiresAt } });
  (await cookies()).set(COOKIE, id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires: expiresAt });
}

export async function destroySession() {
  const c = await cookies();
  const id = c.get(COOKIE)?.value;
  if (id) await db.session.deleteMany({ where: { id } });
  c.delete(COOKIE);
}

export async function currentUser() {
  const id = (await cookies()).get(COOKIE)?.value;
  if (!id) return null;
  const s = await db.session.findUnique({ where: { id }, include: { user: true } });
  if (!s || s.expiresAt < new Date()) return null;
  return s.user;
}

/** Restaurant ids this user may manage: their own, or every restaurant of their partner. */
export async function restaurantIdsFor(user: NonNullable<Awaited<ReturnType<typeof currentUser>>>) {
  if (user.role === "PARTNER" && user.partnerId) {
    return (await db.restaurant.findMany({ where: { partnerId: user.partnerId }, select: { id: true } })).map((r) => r.id);
  }
  return user.restaurantId ? [user.restaurantId] : [];
}

export async function canManage(restaurantId: string) {
  const u = await currentUser();
  if (!u) return null;
  return (await restaurantIdsFor(u)).includes(restaurantId) ? u : null;
}
