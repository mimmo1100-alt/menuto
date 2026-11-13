import { test, expect, SLUG, login, ready, restaurant, db, plainItem } from "./fixtures";

test("ordering from a table QR: only the name, the table reaches the kitchen", async ({ page, browser }) => {
  const r = await restaurant();
  const table = r.tables.find((t) => t.name === "5")!;
  await page.goto(`/r/${SLUG}?t=${table.code}`);
  await ready(page);
  await expect(page.locator(".tablebar")).toContainText("Tavolo 5");
  await page.click('button.item:has-text("Acqua")');
  await page.click(".sheet button.btn, .scrim button.btn");
  await page.click('button[aria-label="Carrello"]');
  await expect(page.locator("#c-email")).toHaveCount(0);
  await page.fill("#c-first", "Sara");
  await page.click("form button[type=submit]");
  await page.check("input[name=pay][value=card_table]");
  await page.click("form button[type=submit]");
  await Promise.all([page.waitForURL(/\/o\/.*\?t=/), page.click('button.btn.block:has-text("Invia")')]);
  await expect(page.getByRole("link", { name: "Ordina altro" })).toHaveAttribute("href", `/r/${SLUG}?t=${table.code}`);

  const id = page.url().split("/o/")[1].split("?")[0];
  const o = await db.order.findUniqueOrThrow({ where: { id } });
  expect(o).toMatchObject({ type: "DINEIN", table: "5", tableId: table.id, email: "" });

  const ctx = await browser.newContext();
  await login(ctx.request);
  const k = await ctx.newPage();
  await k.goto("/dashboard/orders");
  await expect(k.locator(".order", { hasText: `#${o.number}` }).locator(".tablebadge")).toHaveText("Tavolo 5");
  const receipt = await (await ctx.request.get(`/api/kitchen/${r.id}/orders/${id}/receipt?f=text`)).text();
  expect(receipt).toContain("Tavolo 5");
  expect(receipt).toContain("Carta o Bancomat al tavolo"); // payment on the kitchen ticket
  await ctx.close();
});

test("without a table QR 'at the table' is not offered, and a wrong or disabled table is refused", async ({ page, request }) => {
  await page.goto(`/r/${SLUG}`);
  await ready(page);
  await page.click(".hero .btn");
  await page.click('button.item:has-text("Acqua")');
  await page.click(".sheet button.btn, .scrim button.btn");
  await page.click('button[aria-label="Carrello"]');
  await page.fill("#c-first", "A"); await page.fill("#c-last", "B"); await page.fill("#c-email", "a@b.it"); await page.fill("#c-phone", "3331234567");
  await page.click("form button[type=submit]");
  await expect(page.locator("#t-DINEIN")).toHaveCount(0);

  await page.goto(`/r/${SLUG}?t=nonesiste`);
  await expect(page.getByText("non è più attivo")).toBeVisible();

  const r = await restaurant();
  const item = await plainItem();
  const body = (code?: string) => ({ lines: [{ itemId: item.id, optionIds: [], qty: 1 }], type: "DINEIN", when: { asap: true }, customer: { firstName: "X" }, payment: "cash", tableCode: code, table: "99" });
  expect((await (await request.post(`/api/r/${SLUG}/orders`, { data: body() })).json()).error).toBe("table");
  const t3 = r.tables.find((t) => t.name === "3")!;
  await db.table.update({ where: { id: t3.id }, data: { active: false } });
  expect((await (await request.post(`/api/r/${SLUG}/orders`, { data: body(t3.code) })).json()).error).toBe("table");
  await db.table.update({ where: { id: t3.id }, data: { active: true } });
  const ok = await request.post(`/api/r/${SLUG}/orders`, { data: body(t3.code) });
  expect(ok.ok()).toBeTruthy();
  expect((await db.order.findUniqueOrThrow({ where: { id: (await ok.json()).id } })).table).toBe("3"); // never the "99" the browser sent
});
