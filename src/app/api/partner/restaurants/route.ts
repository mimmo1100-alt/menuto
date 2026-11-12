import { NextResponse } from "next/server";
import { createRestaurant, newRestaurantSchema, requirePartner } from "@/lib/partner";

export async function POST(req: Request) {
  const u = await requirePartner();
  if (!u) return NextResponse.json({ error: "auth" }, { status: 401 });
  const parsed = newRestaurantSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  try {
    const r = await createRestaurant(u.partnerId!, parsed.data);
    return NextResponse.json({ id: r.id, slug: r.slug });
  } catch (e) {
    const code = e instanceof Error ? e.message : "server";
    if (code === "email_taken" || code === "password") return NextResponse.json({ error: code }, { status: 400 });
    throw e;
  }
}
