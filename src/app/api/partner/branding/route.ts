import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePartner } from "@/lib/partner";

const schema = z.object({ name: z.string().trim().min(2).max(80), imprint: z.string().trim().max(120) });

export async function PUT(req: Request) {
  const u = await requirePartner();
  if (!u) return NextResponse.json({ error: "auth" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  await db.partner.update({ where: { id: u.partnerId! }, data: { name: parsed.data.name, imprint: parsed.data.imprint || null } });
  return NextResponse.json({ ok: true });
}
