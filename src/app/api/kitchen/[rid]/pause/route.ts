import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { canManage } from "@/lib/auth";

const body = z.object({ minutes: z.number().int().min(0).max(24 * 60), services: z.array(z.enum(["PICKUP", "DELIVERY", "DINEIN"])).default([]), message: z.string().max(200).default("") });

/** Pause (minutes > 0) or resume (minutes = 0) online ordering from the orders app. */
export async function POST(req: Request, { params }: { params: Promise<{ rid: string }> }) {
  const { rid } = await params;
  if (!(await canManage(rid))) return NextResponse.json({ error: "auth" }, { status: 401 });
  const p = body.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const r = await db.restaurant.update({
    where: { id: rid },
    data: p.data.minutes > 0
      ? { pausedUntil: new Date(Date.now() + p.data.minutes * 60000), pausedServices: p.data.services, pauseMessage: p.data.message || null }
      : { pausedUntil: null, pausedServices: [], pauseMessage: null },
    select: { pausedUntil: true, pausedServices: true, pauseMessage: true },
  });
  return NextResponse.json(r);
}

export async function GET(_req: Request, { params }: { params: Promise<{ rid: string }> }) {
  const { rid } = await params;
  if (!(await canManage(rid))) return NextResponse.json({ error: "auth" }, { status: 401 });
  const r = await db.restaurant.findUnique({ where: { id: rid }, select: { pausedUntil: true, pausedServices: true, pauseMessage: true, services: true } });
  return NextResponse.json(r);
}
