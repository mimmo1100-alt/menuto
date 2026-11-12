// Runs database migrations during a deploy. Works with Vercel's Neon or Supabase integrations,
// which name their connection strings differently, and does nothing when no database is connected yet.
import { execSync } from "node:child_process";

const e = process.env;
const pooled = e.DATABASE_URL ?? e.POSTGRES_PRISMA_URL ?? e.POSTGRES_URL;
const direct = e.DIRECT_URL ?? e.DATABASE_URL_UNPOOLED ?? e.POSTGRES_URL_NON_POOLING ?? pooled;
if (!pooled) {
  console.log("[migrate] No database connected yet: skipping migrations.");
  process.exit(0);
}
execSync("npx prisma migrate deploy", { stdio: "inherit", env: { ...e, DATABASE_URL: pooled, DIRECT_URL: direct } });
