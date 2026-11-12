import { NextResponse } from "next/server";
import { canManage } from "@/lib/auth";
import { toEscPos, type RLine } from "@/lib/receipt";

/** A short ESC/POS test page so staff can check the printer from the orders app. */
export async function GET(req: Request, { params }: { params: Promise<{ rid: string }> }) {
  const { rid } = await params;
  if (!(await canManage(rid))) return NextResponse.json({ error: "auth" }, { status: 401 });
  const cols = new URL(req.url).searchParams.get("cols") === "32" ? 32 : 42;
  const lines: RLine[] = [
    { k: "text", text: "Menuto", align: "center", bold: true, size: 2 },
    { k: "text", text: "Stampa di prova / Test print", align: "center" },
    { k: "rule" },
    { k: "pair", left: "Margherita", right: "7,50 €" },
    { k: "pair", left: "TOTALE", right: "7,50 €", bold: true },
    { k: "rule" },
    { k: "text", text: new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC", align: "center" },
    { k: "feed", n: 3 },
  ];
  return new NextResponse(Buffer.from(toEscPos(lines, cols)), { headers: { "content-type": "application/octet-stream" } });
}
