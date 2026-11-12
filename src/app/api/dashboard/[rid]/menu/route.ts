import { NextResponse } from "next/server";
import { canManage } from "@/lib/auth";
import { loadMenuEdit, menuSchema, saveMenuEdit } from "@/lib/menu-edit";

export async function GET(_req: Request, { params }: { params: Promise<{ rid: string }> }) {
  const { rid } = await params;
  if (!(await canManage(rid))) return NextResponse.json({ error: "auth" }, { status: 401 });
  return NextResponse.json(await loadMenuEdit(rid));
}

export async function PUT(req: Request, { params }: { params: Promise<{ rid: string }> }) {
  const { rid } = await params;
  const user = await canManage(rid);
  if (!user || user.role === "STAFF") return NextResponse.json({ error: "auth" }, { status: 401 });
  const parsed = menuSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid", issues: parsed.error.issues.slice(0, 5) }, { status: 400 });
  await saveMenuEdit(rid, parsed.data);
  return NextResponse.json(await loadMenuEdit(rid));
}
