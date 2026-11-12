import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { canManage } from "@/lib/auth";
import { addMember, memberSchema, teamOf } from "@/lib/team";

/** Add a person to the restaurant (owner or partner only). */
export async function POST(req: Request, { params }: { params: Promise<{ rid: string }> }) {
  const { rid } = await params;
  const user = await canManage(rid);
  if (!user || user.role === "STAFF") return NextResponse.json({ error: "auth" }, { status: 401 });
  try {
    await addMember(rid, memberSchema.parse(await req.json()));
    return NextResponse.json(await teamOf(rid));
  } catch (e) {
    if (e instanceof ZodError) return NextResponse.json({ error: "invalid" }, { status: 400 });
    if (e instanceof Error && e.message === "email_taken") return NextResponse.json({ error: "email_taken" }, { status: 422 });
    throw e;
  }
}
