import { headers } from "next/headers";
import { pickLang } from "@/lib/i18n";
import OrderTracker from "@/components/OrderTracker";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  return <OrderTracker slug={slug} id={id} initialLang={pickLang((await headers()).get("accept-language"))} />;
}
