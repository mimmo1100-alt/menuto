import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { canManage } from "@/lib/auth";
import { loadTables, saveTables, tablesSchema } from "@/lib/tables";

export async function PUT(req: Request, { params }: { params: Promise<{ rid: string }> }) {
  const { rid } = await params;
  const user = await canManage(rid);
  if (!user || user.role === "STAFF") return NextResponse.json({ error: "auth" }, { status: 401 });
  try {
    await saveTables(rid, tablesSchema.parse(await req.json()));
    return NextResponse.json(await loadTables(rid));
  } catch (e) {
    if (e instanceof ZodError) return NextResponse.json({ error: "invalid" }, { status: 400 });
    if (e instanceof Error && ["duplicate_table", "payments", "services"].includes(e.message)) return NextResponse.json({ error: e.message }, { status: 422 });
    console.error(e);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
