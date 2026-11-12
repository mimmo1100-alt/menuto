import { NextResponse } from "next/server";
import { loadRestaurant } from "@/lib/menu";
import { quote, quoteSchema } from "@/lib/orders";
import { OrderError } from "@/lib/pricing";
import { clientIp, limitOr429 } from "@/lib/rate-limit";

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const limited = await limitOr429([[`quote:${clientIp(req)}`, 120, 60]]);
  if (limited) return limited;
  const r = await loadRestaurant(slug);
  if (!r) return NextResponse.json({ error: "invalid" }, { status: 404 });
  const parsed = quoteSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  try {
    const { totals } = await quote(r, parsed.data);
    return NextResponse.json(totals);
  } catch (e) {
    if (e instanceof OrderError) return NextResponse.json({ error: e.code }, { status: 422 });
    throw e;
  }
}
