import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { createDemoRestaurant } from "@/lib/demo";

const schema = z.object({
  company: z.string().trim().min(2).max(80),
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(200),
});

/** One-time setup: works only while there are no users. Creates the partner account and a demo restaurant. */
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const { company, name, email, password } = parsed.data;
  const user = await db.$transaction(async (tx) => {
    if ((await tx.user.count()) > 0) return null;
    const partner = await tx.partner.create({ data: { name: company, imprint: `Supported by ${company}` } });
    return tx.user.create({ data: { email, name, role: "PARTNER", partnerId: partner.id, passwordHash: await bcrypt.hash(password, 10) } });
  });
  if (!user) return NextResponse.json({ error: "done" }, { status: 409 });
  await createDemoRestaurant(db, { partnerId: user.partnerId, notifyEmails: [email] });
  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
