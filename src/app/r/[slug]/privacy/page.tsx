import LegalPage from "@/components/LegalPage";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false } };

export default async function Page({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ lang?: string }> }) {
  return <LegalPage slug={(await params).slug} kind="privacy" lang={(await searchParams).lang} />;
}
