import { NextResponse } from "next/server";
import { db } from "./db";

/**
 * Fixed-window rate limit stored in Postgres (RateHit), so it works on Vercel without Redis.
 * Returns true when the call is allowed. On a database error it lets the call through:
 * a broken limiter must never stop real orders.
 */
export async function rateLimit(key: string, limit: number, windowSec: number): Promise<boolean> {
  const ms = windowSec * 1000;
  const windowStart = new Date(Math.floor(Date.now() / ms) * ms);
  try {
    const rows = await db.$queryRaw<{ count: number }[]>`
      INSERT INTO "RateHit" ("key", "windowStart", "count") VALUES (${key}, ${windowStart}, 1)
      ON CONFLICT ("key", "windowStart") DO UPDATE SET "count" = "RateHit"."count" + 1
      RETURNING "count"`;
    if (Math.random() < 0.02) await db.rateHit.deleteMany({ where: { windowStart: { lt: new Date(Date.now() - 2 * 864e5) } } });
    return (rows[0]?.count ?? 0) <= limit;
  } catch (e) {
    console.error("rate limit", e);
    return true;
  }
}

/** Current count of a window without adding to it (for limits that only count failures). */
export async function isLimited(key: string, limit: number, windowSec: number): Promise<boolean> {
  const ms = windowSec * 1000;
  const windowStart = new Date(Math.floor(Date.now() / ms) * ms);
  try {
    const row = await db.rateHit.findUnique({ where: { key_windowStart: { key, windowStart } } });
    return (row?.count ?? 0) >= limit;
  } catch {
    return false;
  }
}

/** The visitor's IP as Vercel reports it (first entry of x-forwarded-for). */
export function clientIp(req: Request) {
  return (req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "local").trim();
}

/** Checks every rule; answers 429 with the first one that is over. null = go on. */
export async function limitOr429(rules: [key: string, limit: number, windowSec: number][]) {
  for (const [key, limit, windowSec] of rules) {
    if (!(await rateLimit(key, limit, windowSec))) {
      return NextResponse.json({ error: "too_many" }, { status: 429, headers: { "retry-after": String(windowSec) } });
    }
  }
  return null;
}
