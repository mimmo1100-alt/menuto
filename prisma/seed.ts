import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createDemoRestaurant } from "../src/lib/demo";

/** Local development only: wipes the database and creates the demo restaurant with test logins. */
const db = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("Refusing to wipe a production database");
  await db.order.deleteMany();
  await db.restaurant.deleteMany();
  await db.user.deleteMany();
  await db.partner.deleteMany();
  const partner = await db.partner.create({ data: { name: "Menuto Demo Partner", imprint: "Supported by Menuto Demo Partner" } });
  const r = await createDemoRestaurant(db, { partnerId: partner.id, notifyEmails: ["owner@example.com"] });
  const hash = await bcrypt.hash("demo1234", 10);
  await db.user.createMany({
    data: [
      { email: "partner@menuto.test", passwordHash: hash, role: "PARTNER", partnerId: partner.id, name: "Partner" },
      { email: "owner@menuto.test", passwordHash: hash, role: "OWNER", restaurantId: r.id, name: "Nino" },
    ],
  });
  console.log("Seeded", r.slug);
}

main().finally(() => db.$disconnect());
