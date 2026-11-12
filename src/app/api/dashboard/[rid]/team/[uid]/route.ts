import { NextResponse } from "next/server";
import { canManage } from "@/lib/auth";
import { removeMember, teamOf } from "@/lib/team";

export async function DELETE(_req: Request, { params }: { params: Promise<{ rid: string; uid: string }> }) {
  const { rid, uid } = await params;
  const user = await canManage(rid);
  if (!user || user.role === "STAFF") return NextResponse.json({ error: "auth" }, { status: 401 });
  try {
    await removeMember(rid, uid, user.id);
    return NextResponse.json(await teamOf(rid));
  } catch (e) {
    if (e instanceof Error && ["self", "not_found", "last_owner"].includes(e.message)) return NextResponse.json({ error: e.message }, { status: 422 });
    throw e;
  }
}
