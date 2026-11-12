import { randomBytes } from "crypto";
import type { PrismaClient } from "@prisma/client";

const L = (it: string, en: string, ar: string) => ({ it, en, ar });
const eur = (n: number) => Math.round(n * 100);

/** Creates the demo restaurant (menu, option groups, delivery areas, coupon) used to try Menuto. */
export async function createDemoRestaurant(db: PrismaClient, opts: { partnerId: string | null; notifyEmails: string[]; slug?: string }) {
  const { partnerId, notifyEmails } = opts;
  const slug = opts.slug ?? "trattoria-da-nino";
  const r = await db.restaurant.create({
    data: {
      slug,
      name: "Trattoria Da Nino (demo)",
      phone: "+39 02 0000 0000",
      address: "Via Esempio 12",
      city: "Milano",
      postcode: "20100",
      lat: 45.4642,
      lng: 9.19,
      isDemo: true,
      partnerId,
      services: ["PICKUP", "DELIVERY", "DINEIN"],
      notifyEmails,
      maxDaysAhead: 7,
      hours: { create: [{ days: [0, 1, 2, 3, 4, 5, 6], from: "11:00", to: "23:30" }] },
      zones: {
        create: [
          { name: "Centro", kind: "circle", centerLat: 45.4642, centerLng: 9.19, radiusM: 2500, minOrder: eur(12), fee: eur(1), position: 0 },
          { name: "Periferia", kind: "circle", centerLat: 45.4642, centerLng: 9.19, radiusM: 6000, minOrder: eur(20), fee: eur(3), position: 1, color: "#2c7a3c" },
        ],
      },
      coupons: { create: [{ code: "BENVENUTO10", kind: "percent", value: 10 }] },
      tables: { create: Array.from({ length: 8 }, (_, i) => ({ name: String(i + 1), position: i, code: randomBytes(6).toString("base64url") })) },
    },
  });

  // reusable option groups
  const extra = await db.optionGroup.create({
    data: {
      restaurantId: r.id, name: L("Extra", "Extras", "إضافات"), required: false, min: 0, max: 0,
      options: { create: [
        { name: L("Mozzarella di bufala", "Buffalo mozzarella", "موتزاريلا جاموسي"), price: eur(2.5), position: 0 },
        { name: L("Funghi", "Mushrooms", "مشروم"), price: eur(1.5), position: 1 },
        { name: L("Salame piccante", "Spicy salami", "سلامي حار"), price: eur(1.5), position: 2 },
        { name: L("Prosciutto crudo", "Cured ham", "بريشوتو"), price: eur(2), position: 3 },
        { name: L("Olive", "Olives", "زيتون"), price: eur(1), position: 4 },
      ] },
    },
  });
  const dough = await db.optionGroup.create({
    data: {
      restaurantId: r.id, name: L("Impasto", "Dough", "العجينة"), required: true, min: 1, max: 1, position: 1,
      options: { create: [
        { name: L("Classico", "Classic", "كلاسيك"), price: 0, preselected: true, position: 0 },
        { name: L("Integrale", "Wholemeal", "قمح كامل"), price: eur(1), position: 1 },
        { name: L("Senza glutine", "Gluten free", "بدون جلوتين"), price: eur(2.5), position: 2 },
      ] },
    },
  });
  const halfPizzas = [
    [L("Margherita", "Margherita", "مارجريتا"), 3.5],
    [L("Diavola", "Diavola", "ديافولا"), 4.25],
    [L("Capricciosa", "Capricciosa", "كابريتشوزا"), 4.75],
    [L("Quattro formaggi", "Four cheese", "أربع أجبان"), 4.75],
  ] as const;
  const half1 = await db.optionGroup.create({
    data: {
      restaurantId: r.id, name: L("Prima metà", "First half", "النص الأول"), required: true, min: 1, max: 1, position: 2,
      options: { create: halfPizzas.map(([n, p], i) => ({ name: n, price: eur(p), position: i })) },
    },
  });
  const half2 = await db.optionGroup.create({
    data: {
      restaurantId: r.id, name: L("Seconda metà", "Second half", "النص التاني"), required: true, min: 1, max: 1, position: 3,
      options: { create: halfPizzas.map(([n, p], i) => ({ name: n, price: eur(p), position: i })) },
    },
  });
  const sauces = await db.optionGroup.create({
    data: {
      restaurantId: r.id, name: L("Salse", "Sauces", "صوصات"), required: false, min: 0, max: 2, position: 4,
      options: { create: [
        { name: L("Ketchup", "Ketchup", "كاتشب"), price: eur(0.5), position: 0 },
        { name: L("Maionese", "Mayonnaise", "مايونيز"), price: eur(0.5), position: 1 },
      ] },
    },
  });

  const sizes = (base: number) => ({
    create: [
      { name: L("Normale", "Regular", "عادي"), price: eur(base), preselected: true, position: 0 },
      { name: L("Maxi", "Large", "كبير"), price: eur(base + 3.5), position: 1 },
    ],
  });

  const pizze = await db.category.create({
    data: {
      restaurantId: r.id, position: 0,
      name: L("Pizze rosse", "Red pizzas", "بيتزا بالصلصة"),
      desc: L("Impasto a lunga lievitazione, 48 ore.", "Slow-rise dough, 48 hours.", "عجينة مخمّرة ٤٨ ساعة."),
      groups: { create: [{ groupId: dough.id, position: 0 }, { groupId: extra.id, position: 1 }] },
    },
  });
  const pizzaItems = [
    ["Margherita", "Margherita", "مارجريتا", "Pomodoro, fiordilatte, basilico", "Tomato, fior di latte, basil", "طماطم، موتزاريلا، ريحان", 7, ["vegetarian"]],
    ["Diavola", "Diavola", "ديافولا", "Pomodoro, fiordilatte, salame piccante", "Tomato, fior di latte, spicy salami", "طماطم، موتزاريلا، سلامي حار", 8.5, ["spicy"]],
    ["Capricciosa", "Capricciosa", "كابريتشوزا", "Pomodoro, fiordilatte, cotto, funghi, carciofi, olive", "Tomato, fior di latte, ham, mushrooms, artichokes, olives", "طماطم، موتزاريلا، لحم، مشروم، خرشوف، زيتون", 9.5, []],
  ] as const;
  for (const [i, p] of pizzaItems.entries()) {
    await db.item.create({
      data: {
        restaurantId: r.id, categoryId: pizze.id, position: i,
        name: L(p[0], p[1], p[2]), desc: L(p[3], p[4], p[5]), labels: [...p[7]], sizes: sizes(p[6]),
      },
    });
  }
  await db.item.create({
    data: {
      restaurantId: r.id, categoryId: pizze.id, position: 3,
      name: L("Pizza metà e metà", "Half & half pizza", "بيتزا نص ونص"),
      desc: L("Scegli due gusti", "Pick two flavours", "اختار طعمين"),
      price: 0,
      groups: { create: [{ groupId: half1.id, position: 0 }, { groupId: half2.id, position: 1 }] },
    },
  });

  const fritti = await db.category.create({
    data: { restaurantId: r.id, position: 1, name: L("Fritti", "Fried", "مقليات") },
  });
  await db.item.create({
    data: {
      restaurantId: r.id, categoryId: fritti.id, position: 0,
      name: L("Patatine fritte", "French fries", "بطاطس مقلية"),
      sizes: { create: [
        { name: L("Piccola", "Small", "صغير"), price: eur(3.5), preselected: true, position: 0 },
        { name: L("Grande", "Large", "كبير"), price: eur(4.5), position: 1 },
      ] },
      groups: { create: [{ groupId: sauces.id }] },
    },
  });
  await db.item.create({
    data: {
      restaurantId: r.id, categoryId: fritti.id, position: 1,
      name: L("Arancini (3 pz)", "Arancini (3 pcs)", "أرانشيني (٣ قطع)"),
      desc: L("Ragù e piselli", "Meat ragù and peas", "لحم مفروم وبسلة"), price: eur(5), soldOutIndef: true,
    },
  });

  const bevande = await db.category.create({
    data: { restaurantId: r.id, position: 2, name: L("Bevande", "Drinks", "مشروبات") },
  });
  await db.item.createMany({
    data: [
      { restaurantId: r.id, categoryId: bevande.id, position: 0, name: L("Acqua naturale 0,5 l", "Still water 0.5 l", "مياه ٠٫٥ لتر"), price: eur(1.5) },
      { restaurantId: r.id, categoryId: bevande.id, position: 1, name: L("Cola 0,33 l", "Cola 0.33 l", "كولا ٠٫٣٣ لتر"), price: eur(2.5) },
    ],
  });

  return r;
}
