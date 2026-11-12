import { NextResponse } from "next/server";
import { canManage } from "@/lib/auth";
import { loadSettings, saveSettings, settingsSchema } from "@/lib/settings-edit";

export async function PUT(req: Request, { params }: { params: Promise<{ rid: string }> }) {
  const { rid } = await params;
  const user = await canManage(rid);
  if (!user || user.role === "STAFF") return NextResponse.json({ error: "auth" }, { status: 401 });
  const parsed = settingsSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid", issues: parsed.error.issues.slice(0, 5).map((i) => ({ path: i.path.join("."), message: i.message })) }, { status: 400 });
  try {
    await saveSettings(rid, parsed.data);
  } catch (e) {
    if (e instanceof Error && e.message === "duplicate_coupon") return NextResponse.json({ error: "duplicate_coupon" }, { status: 400 });
    if ((e as { code?: string }).code === "P2002") return NextResponse.json({ error: "duplicate_coupon" }, { status: 400 });
    throw e;
  }
  return NextResponse.json(await loadSettings(rid));
}
