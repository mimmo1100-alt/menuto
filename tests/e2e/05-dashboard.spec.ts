import { test, expect, SLUG, login, ready, restaurant, db, apiOrder, PARTNER } from "./fixtures";

test("settings: switching off a payment method hides it from customers", async ({ page }) => {
  const r = await restaurant();
  await login(page.request);
  await page.goto("/dashboard/settings");
  await ready(page);
  await page.uncheck("#pay-PICKUP-satispay");
  await page.click(".savebar button.btn:not(.ghost)");
  await expect(page.locator(".savebar")).toContainText("Salvato");
  expect(((await db.restaurant.findUniqueOrThrow({ where: { id: r.id } })).payments as Record<string, string[]>).PICKUP).not.toContain("satispay");
  expect((await apiOrder(page.request, { payment: "satispay" })).status()).toBe(422);
  await page.check("#pay-PICKUP-satispay");
  await page.click(".savebar button.btn:not(.ghost)");
  await expect(page.locator(".savebar")).toContainText("Salvato");
});

test("menu: a price changed in the editor is what the customer pays", async ({ page }) => {
  const r = await restaurant();
  await login(page.request);
  const menu = await (await page.request.get(`/api/dashboard/${r.id}/menu`)).json();
  const water = menu.categories.flatMap((c: { items: { name: { it: string }; price: number }[] }) => c.items).find((i: { name: { it: string } }) => i.name.it.startsWith("Acqua"));
  const old = water.price;
  water.price = 199;
  expect((await page.request.put(`/api/dashboard/${r.id}/menu`, { data: menu })).ok()).toBeTruthy();
  const res = await apiOrder(page.request);
  expect((await db.order.findUniqueOrThrow({ where: { id: (await res.json()).id } })).total).toBe(398);
  water.price = old;
  expect((await page.request.put(`/api/dashboard/${r.id}/menu`, { data: menu })).ok()).toBeTruthy();
  await page.goto("/dashboard/menu");
  await expect(page.locator(".acat").first()).toBeVisible();
});

test("tables: add two, rename one, print sheet has a card for each active table", async ({ page }) => {
  await login(page.request);
  await page.goto("/dashboard/tables");
  await ready(page);
  await page.fill("input[type=number]", "2");
  await page.click('button:has-text("Aggiungi")');
  await page.locator(".trow input[type=text]").last().fill("Terrazza");
  await page.click(".savebar button");
  await expect(page.locator(".savebar")).toContainText("Salvato");
  const r = await restaurant();
  expect(r.tables.map((t) => t.name)).toEqual(["1", "2", "3", "4", "5", "6", "7", "8", "9", "Terrazza"]);
  expect(new Set(r.tables.map((t) => t.code)).size).toBe(10);
  await page.goto(`/dashboard/tables/print?r=${r.id}`);
  await expect(page.locator(".qrcard")).toHaveCount(10);
  await expect(page.locator(".qrcard .tn").last()).toHaveText("Terrazza");
});

test("reports match the orders, test orders don't count, CSV downloads", async ({ page }) => {
  const r = await restaurant();
  await login(page.request);
  await page.request.post(`/api/kitchen/${r.id}/test-order`);
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Rome" }).format(new Date());
  const rep = await (await page.request.get(`/api/dashboard/${r.id}/reports?from=${today}&to=${today}`)).json();
  const sold = await db.order.aggregate({
    where: { restaurantId: r.id, status: { in: ["ACCEPTED", "READY", "COMPLETED"] }, NOT: { email: { endsWith: "@menuto.invalid" } } },
    _count: true, _sum: { total: true },
  });
  expect(rep.sold.orders).toBe(sold._count);
  expect(rep.sold.sales).toBe(sold._sum.total ?? 0);
  const csv = await page.request.get(`/api/dashboard/${r.id}/reports?from=${today}&to=${today}&format=csv`);
  expect(csv.headers()["content-type"]).toContain("text/csv");
  expect(await csv.text()).not.toContain("menuto.invalid");
  await page.goto("/dashboard/reports");
  await expect(page.locator(".rep-kpi").first()).toBeVisible();
});

test("partner panel lists the restaurant", async ({ page }) => {
  await login(page.request, PARTNER);
  await page.goto("/dashboard/partner");
  await expect(page.getByText("Trattoria Da Nino (demo)").first()).toBeVisible();
});

test("GloriaFood import (JSON file) shows what it would bring in without changing the menu", async ({ page }) => {
  const r = await restaurant();
  await login(page.request);
  const before = await db.item.count({ where: { restaurantId: r.id } });
  const json = JSON.stringify({ currency: "EUR", categories: [{ id: 1, name: "Pizze", items: [{ id: 10, name: "Margherita", price: 7, sizes: [{ id: 100, name: "Normale", price: 7 }, { id: 101, name: "Maxi", price: 12 }], groups: [{ id: 5, name: "Extra", options: [{ id: 50, name: "Bufala", price: 2 }] }] }] }] });
  const res = await page.request.post(`/api/dashboard/${r.id}/import`, { data: { json, apply: false } });
  expect(res.ok()).toBeTruthy();
  expect((await res.json()).report).toMatchObject({ categories: 1, items: 1, sizes: 2, options: 1 });
  expect(await db.item.count({ where: { restaurantId: r.id } })).toBe(before);
});

test("privacy notice and order terms show the restaurant's legal details", async ({ page }) => {
  const r = await restaurant();
  await db.restaurant.update({ where: { id: r.id }, data: { legalName: "Da Nino S.r.l.", vatNumber: "IT01234567890" } });
  await page.goto(`/r/${SLUG}/privacy`);
  await expect(page.locator("h1")).toHaveText("Informativa privacy");
  await expect(page.getByText("Da Nino S.r.l., P.IVA IT01234567890").first()).toBeVisible();
  await page.goto(`/r/${SLUG}/terms?lang=en`);
  await expect(page.locator("h1")).toHaveText("Order terms");
});

test("end-of-day email is sent once per restaurant and day", async ({ request }) => {
  const r = await restaurant();
  // an order placed yesterday (restaurant time)
  const o = await db.order.findFirstOrThrow({ where: { restaurantId: r.id } });
  await db.order.update({ where: { id: o.id }, data: { status: "COMPLETED", createdAt: new Date(Date.now() - 864e5) } });
  const first = await (await request.get("/api/cron/daily-report")).json();
  const second = await (await request.get("/api/cron/daily-report")).json();
  const res = (x: { results: { result: string }[] }) => x.results[0].result;
  if (res(first) === "too_early") test.skip(true, "before 04:00 in Rome the day isn't over yet");
  expect(res(first)).toBe("sent");
  expect(res(second)).toBe("already_sent");
  expect(await db.emailLog.count({ where: { kind: "daily_report" } })).toBe(1);
});
