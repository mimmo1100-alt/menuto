import { db } from "./db";
import { baseUrl } from "./order-emails";

/**
 * Go-live checklist per restaurant and the system status, for the partner moving restaurants to Menuto.
 * Each check says what is missing and where to fix it.
 */
export type Check = { key: string; ok: boolean; fix: string; detail?: string; optional?: boolean };

export async function readiness(restaurantId: string): Promise<Check[]> {
  const r = await db.restaurant.findUniqueOrThrow({
    where: { id: restaurantId },
    include: {
      hours: true, zones: { where: { hidden: false } }, users: { where: { role: "OWNER" }, select: { id: true } },
      tables: { where: { active: true }, select: { id: true } },
      categories: { where: { hidden: false }, select: { _count: { select: { items: { where: { hidden: false } } } } } },
    },
  });
  const [testOrders, printed] = await Promise.all([
    db.order.count({ where: { restaurantId, email: { endsWith: "@menuto.invalid" } } }),
    db.order.count({ where: { restaurantId, printedAt: { not: null } } }),
  ]);
  const q = `?r=${r.id}`;
  const items = r.categories.reduce((a, c) => a + c._count.items, 0);
  const pay = r.payments as Record<string, string[]>;
  const svcNoPay = r.services.filter((s) => !(pay[s] ?? []).length);
  const checks: Check[] = [
    { key: "menu", ok: items > 0, fix: `/dashboard/menu${q}`, detail: String(items) },
    { key: "hours", ok: r.hours.length > 0, fix: `/dashboard/settings${q}` },
    { key: "contacts", ok: !!r.phone && !!r.address && !r.phone.includes("0000 0000"), fix: `/dashboard/settings${q}` },
    { key: "location", ok: r.lat != null && r.lng != null, fix: `/dashboard/settings${q}` },
    { key: "payments", ok: r.services.length > 0 && svcNoPay.length === 0, fix: `/dashboard/settings${q}`, detail: svcNoPay.join(", ") },
    { key: "notify", ok: r.notifyEmails.length > 0, fix: `/dashboard/settings${q}` },
    { key: "legal", ok: !!r.legalName && !!r.vatNumber, fix: `/dashboard/settings${q}` },
    { key: "owner", ok: r.users.length > 0, fix: `/dashboard/team${q}` },
    { key: "testOrder", ok: testOrders > 0, fix: `/dashboard/orders${q}` },
    { key: "printed", ok: printed > 0, fix: `/dashboard/orders${q}`, optional: true },
  ];
  if (r.services.includes("DELIVERY")) checks.splice(5, 0, { key: "zones", ok: r.zones.length > 0, fix: `/dashboard/settings${q}` });
  if (r.services.includes("DINEIN")) checks.push({ key: "tables", ok: r.tables.length > 0, fix: `/dashboard/tables${q}` });
  checks.push({ key: "accepting", ok: r.acceptingOrders, fix: `/dashboard/settings${q}` });
  return checks;
}

export type SystemItem = { key: string; ok: boolean; warn?: boolean; detail?: string };

/** What the deployment looks like from inside: database, public address, emails, morning report. Never shows secrets. */
export async function systemStatus(): Promise<SystemItem[]> {
  const since = new Date(Date.now() - 7 * 864e5);
  let dbOk = true, migrations = 0;
  try {
    const rows = await db.$queryRaw<{ n: bigint }[]>`SELECT count(*) AS n FROM "_prisma_migrations" WHERE finished_at IS NOT NULL`;
    migrations = Number(rows[0]?.n ?? 0);
  } catch { dbOk = false; }
  const [sent, failed, logged, lastReport] = dbOk ? await Promise.all([
    db.emailLog.count({ where: { createdAt: { gte: since }, status: "sent" } }),
    db.emailLog.count({ where: { createdAt: { gte: since }, status: "failed" } }),
    db.emailLog.count({ where: { createdAt: { gte: since }, status: "logged" } }),
    db.dailyReportSent.findFirst({ orderBy: { sentAt: "desc" } }),
  ]) : [0, 0, 0, null];
  const email = !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM;
  const url = baseUrl();
  return [
    { key: "database", ok: dbOk, detail: dbOk ? `${migrations}` : "" },
    { key: "address", ok: !url.includes("localhost") || process.env.NODE_ENV !== "production", warn: !process.env.PUBLIC_URL, detail: url },
    { key: "email", ok: email, detail: email ? `${sent}/${failed}` : `${logged}` },
    { key: "emailFailures", ok: failed === 0, detail: String(failed) },
    { key: "cron", ok: true, warn: !process.env.CRON_SECRET, detail: lastReport ? lastReport.sentAt.toISOString() : "" },
  ];
}
