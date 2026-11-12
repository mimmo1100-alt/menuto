"use client";

import type { Lang } from "@/lib/i18n";
import DashNav from "@/components/DashNav";

export default function NavBar({ lang }: { lang: Lang }) {
  return <DashNav lang={lang} current="partner" restaurant={null} restaurants={[]} isPartner />;
}
