import { test as base, expect, type APIRequestContext, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

export const db = new PrismaClient({ datasources: { db: { url: process.env.TEST_DATABASE_URL } } });
export const SLUG = "trattoria-da-nino";
export const OWNER = { email: "owner@menuto.test", password: "demo1234" };
export const PARTNER = { email: "partner@menuto.test", password: "demo1234" };

const rnd = () => Math.floor(Math.random() * 250) + 1;

/**
 * Every test gets its own client IP (x-forwarded-for), so the rate limits of one test never block the next.
 * Vercel overwrites this header in production, so it can't be used to dodge the limits there.
 */
export const test = base.extend<{ ip: string }>({
  ip: async ({}, use) => { await use(`10.${rnd()}.${rnd()}.${rnd()}`); },
  extraHTTPHeaders: async ({ ip }, use) => { await use({ "x-forwarded-for": ip }); },
});
export { expect };

export async function login(req: APIRequestContext, who: { email: string; password: string } = OWNER) {
  const res = await req.post("/api/auth/login", { data: who });
  expect(res.ok(), `login ${who.email}`).toBeTruthy();
}

export async function restaurant() {
  return db.restaurant.findUniqueOrThrow({ where: { slug: SLUG }, include: { tables: { orderBy: { position: "asc" } } } });
}

/** A menu item that can be ordered with no choices (water). */
export async function plainItem() {
  return db.item.findFirstOrThrow({ where: { restaurant: { slug: SLUG }, name: { path: ["it"], string_starts_with: "Acqua" } } });
}

export const customer = { firstName: "Mario", lastName: "Rossi", email: "mario@example.com", phone: "3331234567" };

/** Places a pickup order through the public API, returns its id. */
export async function apiOrder(req: APIRequestContext, over: Record<string, unknown> = {}) {
  const item = await plainItem();
  const res = await req.post(`/api/r/${SLUG}/orders`, {
    data: { lines: [{ itemId: item.id, optionIds: [], qty: 2 }], type: "PICKUP", when: { asap: true }, customer, payment: "cash", ...over },
  });
  return res;
}

/** Waits until client components are interactive (forms submitted before that would reload the page). */
export async function ready(page: Page) {
  await page.waitForLoadState("networkidle");
}
