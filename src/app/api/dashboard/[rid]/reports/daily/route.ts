import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { canManage } from "@/lib/auth";
import { renderDailyReport } from "@/lib/daily-report";
import { addDaysYmd, localParts } from "@/lib/time";
import { ymdRe } from "@/lib/reports";

/** GET ?date=YYYY-MM-DD (default yesterday): preview of the end-of-day email, nothing is sent. */
export async function GET(req: Request, { params }: { params: Promise<{ rid: string }> }) {
  const { rid } = await params;
  const user = await canManage(rid);
  if (!user || user.role === "STAFF") return NextResponse.json({ error: "auth" }, { status: 401 });
  const r = await db.restaurant.findUniqueOrThrow({ where: { id: rid }, select: { id: true, name: true, timezone: true, currency: true, taxName: true, defaultLang: true } });
  const q = new URL(req.url).searchParams.get("date") ?? "";
  const day = ymdRe.test(q) ? q : addDaysYmd(localParts(new Date(), r.timezone).ymd, -1);
  const { html } = await renderDailyReport(r, day);
  return new NextResponse(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
