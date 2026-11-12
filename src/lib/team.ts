import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "./db";
import { MIN_PASSWORD } from "./password";

export const memberSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(120),
  name: z.string().trim().max(60).default(""),
  password: z.string().min(MIN_PASSWORD).max(200),
  role: z.enum(["OWNER", "STAFF"]),
});

export async function teamOf(restaurantId: string) {
  return db.user.findMany({
    where: { restaurantId }, orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
}

export async function addMember(restaurantId: string, m: z.infer<typeof memberSchema>) {
  if (await db.user.findUnique({ where: { email: m.email } })) throw new Error("email_taken");
  return db.user.create({ data: { email: m.email, name: m.name || null, role: m.role, restaurantId, passwordHash: await bcrypt.hash(m.password, 10) }, select: { id: true } });
}

/** Removes a person from this restaurant (their sessions go with them). Never yourself, never the last owner. */
export async function removeMember(restaurantId: string, userId: string, byUserId: string) {
  if (userId === byUserId) throw new Error("self");
  const u = await db.user.findUnique({ where: { id: userId } });
  if (!u || u.restaurantId !== restaurantId || u.role === "PARTNER") throw new Error("not_found");
  if (u.role === "OWNER" && (await db.user.count({ where: { restaurantId, role: "OWNER" } })) <= 1) throw new Error("last_owner");
  await db.user.delete({ where: { id: userId } });
}
