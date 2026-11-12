import { test, expect, SLUG, login, ready, restaurant, db } from "./fixtures";

test("customer orders a pickup, the kitchen accepts and finishes it, the customer sees each step", async ({ page, browser }) => {
  await page.goto(`/r/${SLUG}`);
  await ready(page);
  await page.click(".hero .btn");
  await page.click('button.item:has-text("Acqua")');
  await page.click(".sheet button.btn, .scrim button.btn");
  await page.click('button[aria-label="Carrello"]');
  await page.fill("#c-first", "Giulia");
  await page.fill("#c-last", "Verdi");
  await page.fill("#c-email", "giulia@example.com");
  await page.fill("#c-phone", "3330001111");
  await page.click("form button[type=submit]");
  await page.check("#t-PICKUP");
  await page.click("form button[type=submit]");
  await page.click("form button[type=submit]"); // time: as soon as possible
  await page.check("input[name=pay][value=cash]");
  await page.click("form button[type=submit]");
  await expect(page.locator(".legalnote a")).toHaveCount(2);
  await Promise.all([page.waitForURL(/\/o\//), page.click('button.btn.block:has-text("Invia")')]);
  await expect(page.getByText("In attesa di conferma")).toBeVisible();

  const id = page.url().split("/o/")[1].split("?")[0];
  const order = await db.order.findUniqueOrThrow({ where: { id } });
  expect(order.total).toBe(150); // 1 x 1,50 €, recalculated on the server
  expect(order.payment).toBe("cash");

  // kitchen
  const ctx = await browser.newContext();
  await login(ctx.request);
  const k = await ctx.newPage();
  await k.goto("/dashboard/orders");
  const card = k.locator(".order", { hasText: `#${order.number}` });
  await expect(card).toBeVisible();
  await card.locator(".prep button", { hasText: /^20$/ }).click();
  await expect(page.getByText("Ordine confermato")).toBeVisible({ timeout: 15_000 });

  await k.click('button:has-text("In preparazione")');
  await k.locator(".order", { hasText: `#${order.number}` }).getByRole("button", { name: "Pronto" }).click();
  await expect(page.getByText("Il tuo ordine è pronto")).toBeVisible({ timeout: 15_000 });

  // emails: customer received/accepted/ready, restaurant new order (only logged in tests)
  const kinds = (await db.emailLog.findMany({ where: { orderId: id } })).map((e) => e.kind).sort();
  expect(kinds).toEqual(expect.arrayContaining(["accepted", "new_order", "ready", "received"]));
  await ctx.close();
  expect((await restaurant()).slug).toBe(SLUG);
});
