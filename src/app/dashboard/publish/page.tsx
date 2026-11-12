import { headers } from "next/headers";
import QRCode from "qrcode";
import { dashContext } from "@/lib/dash-page";
import PublishPage from "@/components/PublishPage";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ r?: string }> }) {
  const { restaurants, current, user } = await dashContext((await searchParams).r);
  if (!current) return <div className="wrap"><p className="empty">Nessun ristorante collegato a questo account.</p></div>;
  const h = await headers();
  const origin = process.env.PUBLIC_URL ?? `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const link = `${origin}/r/${current.slug}`;
  const qr = await QRCode.toString(link, { type: "svg", margin: 1, width: 220 });
  return <PublishPage isPartner={user.role === "PARTNER"} restaurant={current} restaurants={restaurants} origin={origin} link={link} qrSvg={qr} />;
}
