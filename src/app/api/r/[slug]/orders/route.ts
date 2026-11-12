import { after, NextResponse } from "next/server";
import { orderEmails } from "@/lib/order-emails";
import { ZodError } from "zod";
import { createOrder } from "@/lib/orders";
import { OrderError } from "@/lib/pricing";
import { clientIp, limitOr429 } from "@/lib/rate-limit";

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // against fake-order spam. Generous: guests at the tables often share the restaurant's wifi (one IP).
  const ip = clientIp(req);
  const limited = await limitOr429([[`order:${ip}`, 20, 600], [`order-h:${ip}`, 60, 3600]]);
  if (limited) return limited;
  try {
    const order = await createOrder(slug, await req.json());
    after(async () => {
      await orderEmails(order.id, order.status === "ACCEPTED" ? "accepted" : "received");
      await orderEmails(order.id, "new_order");
    });
    return NextResponse.json({ id: order.id, number: order.number, status: order.status });
  } catch (e) {
    if (e instanceof OrderError) return NextResponse.json({ error: e.code }, { status: 422 });
    if (e instanceof ZodError) return NextResponse.json({ error: "invalid", issues: e.issues.slice(0, 5) }, { status: 400 });
    if (e instanceof Error && e.message === "closed") return NextResponse.json({ error: "closed" }, { status: 422 });
    console.error(e);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
