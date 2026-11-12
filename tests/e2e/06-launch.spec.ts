import { test, expect, login, restaurant, db, PARTNER, OWNER } from "./fixtures";

test("go-live checklist shows what each restaurant is missing and links to the fix", async ({ page }) => {
  const r = await restaurant();
  await db.restaurant.update({ where: { id: r.id }, data: { legalName: null, vatNumber: null } });
  await login(page.request, PARTNER);
  await page.goto("/dashboard/partner");
  await page.click('a[href="/dashboard/partner/launch"]');
  const card = page.getByTestId(`launch-${r.id}`);
  const legal = card.locator("li", { hasText: "Partita IVA" });
  await expect(legal).toHaveClass(/bad/);
  await expect(legal.getByRole("link", { name: "Sistema" })).toHaveAttribute("href", `/dashboard/settings?r=${r.id}`);
  await expect(card.locator("li", { hasText: "Menu con almeno un prodotto" })).toHaveClass(/ok/);

  await db.restaurant.update({ where: { id: r.id }, data: { legalName: "Da Nino S.r.l.", vatNumber: "IT01234567890" } });
  await page.reload();
  await expect(card.locator("li", { hasText: "Partita IVA" })).toHaveClass(/ok/);
  await expect(page.getByTestId("system").locator("li", { hasText: "Database collegato" })).toHaveClass(/ok/);
  await expect(page.getByTestId("system").locator("li", { hasText: "Invio email" })).toHaveClass(/bad/); // no Resend key in tests
});

test("only partners see the checklist", async ({ page }) => {
  await login(page.request, OWNER);
  await page.goto("/dashboard/partner/launch");
  await expect(page).toHaveURL(/\/dashboard\/orders/);
});
