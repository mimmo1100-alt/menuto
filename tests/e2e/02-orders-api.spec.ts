import { test, expect, SLUG, apiOrder, customer, plainItem, db, restaurant } from "./fixtures";

test.describe("the server checks every order", () => {
  test("prices come from the server, not from the browser", async ({ request }) => {
    const item = await plainItem();
    const res = await request.post(`/api/r/${SLUG}/orders`, {
      data: { lines: [{ itemId: item.id, optionIds: [], qty: 3, price: 1, unitPrice: 1 }], type: "PICKUP", when: { asap: true }, customer, payment: "cash", total: 1 },
    });
    expect(res.ok()).toBeTruthy();
    const o = await db.order.findUniqueOrThrow({ where: { id: (await res.json()).id } });
    expect(o.total).toBe(item.price * 3);
  });

  test("pickup needs last name, email and phone", async ({ request }) => {
    const res = await apiOrder(request, { customer: { firstName: "Solo" } });
    expect(res.status()).toBe(422);
  });

  test("a payment method the restaurant didn't turn on is refused", async ({ request }) => {
    expect((await apiOrder(request, { payment: "card_courier" })).status()).toBe(422);
    expect((await apiOrder(request, { payment: "bitcoin" })).status()).toBe(422);
    expect((await apiOrder(request, { payment: "satispay" })).ok()).toBeTruthy();
  });

  test("sold-out items are refused", async ({ request }) => {
    const sold = await db.item.findFirstOrThrow({ where: { restaurant: { slug: SLUG }, soldOutIndef: true } });
    const res = await request.post(`/api/r/${SLUG}/orders`, {
      data: { lines: [{ itemId: sold.id, optionIds: [], qty: 1 }], type: "PICKUP", when: { asap: true }, customer, payment: "cash" },
    });
    expect(res.status()).toBe(422);
    expect((await res.json()).error).toBe("item");
  });

  test("too many orders from one connection are stopped, other customers are not", async ({ request, playwright, baseURL }) => {
    const r = await restaurant();
    const before = await db.order.count({ where: { restaurantId: r.id } });
    const codes: number[] = [];
    for (let i = 0; i < 22; i++) codes.push((await apiOrder(request)).status());
    expect(codes.slice(0, 20).every((c) => c === 200)).toBeTruthy();
    expect(codes.slice(20)).toEqual([429, 429]);
    expect(await db.order.count({ where: { restaurantId: r.id } })).toBe(before + 20);
    const other = await playwright.request.newContext({ baseURL, extraHTTPHeaders: { "x-forwarded-for": "10.250.250.250" } });
    expect((await apiOrder(other)).ok()).toBeTruthy();
    await other.dispose();
  });
});
