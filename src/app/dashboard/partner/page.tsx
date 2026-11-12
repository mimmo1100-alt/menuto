import { redirect } from "next/navigation";
import { partnerOverview, requirePartner } from "@/lib/partner";
import PartnerPanel from "@/components/PartnerPanel";

export const dynamic = "force-dynamic";

export default async function Page() {
  const u = await requirePartner();
  if (!u) redirect("/dashboard/orders");
  return <PartnerPanel initial={await partnerOverview(u.partnerId!)} />;
}
