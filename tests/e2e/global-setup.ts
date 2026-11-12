import { execSync } from "node:child_process";

/** Migrates and re-seeds the test database, then makes the demo restaurant open all day so tests don't depend on the clock. */
export default async function globalSetup() {
  const url = process.env.TEST_DATABASE_URL!;
  if (!/test/i.test(new URL(url).pathname)) throw new Error(`Refusing to wipe ${url}: the test database name must contain "test"`);
  const env = { ...process.env, DATABASE_URL: url, DIRECT_URL: url, NODE_ENV: "test" } as NodeJS.ProcessEnv;
  execSync("npx prisma migrate deploy", { env, stdio: "pipe" });
  execSync("npx tsx prisma/seed.ts", { env, stdio: "pipe" });
  const { PrismaClient } = await import("@prisma/client");
  const db = new PrismaClient({ datasources: { db: { url } } });
  await db.emailLog.deleteMany();
  await db.rateHit.deleteMany();
  await db.dailyReportSent.deleteMany();
  await db.openingHours.updateMany({ data: { from: "00:00", to: "23:59" } });
  await db.$disconnect();
}
