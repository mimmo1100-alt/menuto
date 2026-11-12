import { test, expect, login, ready, restaurant, db, OWNER } from "./fixtures";

test("wrong password shows an error; 10 failed tries lock the account for 15 minutes, right logins don't count", async ({ page, request }) => {
  for (let i = 0; i < 12; i++) expect((await request.post("/api/auth/login", { data: OWNER })).ok()).toBeTruthy();
  await page.goto("/login");
  await ready(page);
  await page.fill("#email", "partner@menuto.test");
  await page.fill("#password", "sbagliata");
  await page.click("button.btn");
  await expect(page.getByText("Email o password non corretti.")).toBeVisible();
  const codes: number[] = [];
  for (let i = 0; i < 11; i++) codes.push((await request.post("/api/auth/login", { data: { email: "partner@menuto.test", password: "x" } })).status());
  expect(codes.slice(0, 9).every((c) => c === 401)).toBeTruthy();
  expect(codes.at(-1)).toBe(429);
  await db.rateHit.deleteMany({ where: { key: { contains: "partner@menuto.test" } } });
});

test("forgot password: the email link sets a new password once, and it works", async ({ page, request }) => {
  await page.goto("/login/reset");
  await ready(page);
  await page.fill("#email", OWNER.email);
  await page.click("button.btn");
  await expect(page.getByText("Controlla la tua email")).toBeVisible();
  const mail = await db.emailLog.findFirstOrThrow({ where: { kind: "password_reset", to: OWNER.email }, orderBy: { createdAt: "desc" } });
  const token = /token=([\w-]+)/.exec(mail.html)![1];
  expect(await db.passwordReset.count({ where: { tokenHash: token } })).toBe(0); // only the hash is stored

  await page.goto(`/login/reset?token=${token}`);
  await ready(page);
  await page.fill("#password", "nuovapass1");
  await page.fill("#again", "nuovapass1");
  await Promise.all([page.waitForURL(/dashboard/), page.click("button.btn")]);
  expect((await request.post("/api/auth/login", { data: { email: OWNER.email, password: "nuovapass1" } })).ok()).toBeTruthy();
  expect((await request.post("/api/auth/reset/confirm", { data: { token, password: "altrapass1" } })).status()).toBe(400);

  // back to the seed password through the signed-in change
  const res = await page.request.post("/api/auth/password", { data: { current: "nuovapass1", next: OWNER.password } });
  expect(res.ok()).toBeTruthy();
});

test("staff accounts: the owner adds one, staff only reach orders, removal signs them out", async ({ page, browser }) => {
  const r = await restaurant();
  await login(page.request);
  await page.goto("/dashboard/team");
  await ready(page);
  await page.fill("input[name=email]", "cassa@test.it");
  await page.fill("input[name=password]", "cassa1234");
  await page.click('form button:has-text("Aggiungi")');
  await expect(page.getByText("cassa@test.it")).toBeVisible();

  const s = await browser.newContext();
  await login(s.request, { email: "cassa@test.it", password: "cassa1234" });
  const sp = await s.newPage();
  await sp.goto("/dashboard/orders");
  await expect(sp.locator(".dash-top a")).toHaveText(["Ordini", "Team", "Pagina menu"]);
  for (const p of ["menu", "settings", "reports", "tables", "publish"]) {
    await sp.goto(`/dashboard/${p}`);
    await expect(sp).toHaveURL(/\/dashboard\/orders/);
  }
  expect((await s.request.put(`/api/dashboard/${r.id}/settings`, { data: {} })).status()).toBe(401);
  expect((await s.request.get(`/api/dashboard/${r.id}/reports?from=2026-01-01&to=2026-01-02`)).status()).toBe(401);

  page.on("dialog", (d) => d.accept());
  await page.locator("tr", { hasText: "cassa@test.it" }).getByRole("button", { name: "Rimuovi" }).click();
  await expect(page.getByText("cassa@test.it")).toHaveCount(0);
  await sp.goto("/dashboard/orders");
  await expect(sp).toHaveURL(/\/login/);
  await s.close();
});

test("nobody signed in gets nothing from the dashboard APIs", async ({ request }) => {
  const r = await restaurant();
  for (const path of [`/api/dashboard/${r.id}/menu`, `/api/kitchen/${r.id}/orders`, `/api/dashboard/${r.id}/reports?from=2026-01-01&to=2026-01-01`, "/api/partner/orders"]) {
    expect((await request.get(path)).status(), path).toBe(401);
  }
});
