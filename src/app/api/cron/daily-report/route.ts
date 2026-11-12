import { NextResponse } from "next/server";
import { sendDailyReports } from "@/lib/daily-report";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Called by Vercel Cron every morning (vercel.json). When CRON_SECRET is set, Vercel sends it as a Bearer token
 * and other callers are refused. Without it the route stays usable: each restaurant/day is sent at most once anyway.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "auth" }, { status: 401 });
  return NextResponse.json({ results: await sendDailyReports() });
}
