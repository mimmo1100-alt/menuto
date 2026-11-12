import { dashContext } from "@/lib/dash-page";
import { teamOf } from "@/lib/team";
import TeamPage from "@/components/TeamPage";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ r?: string }> }) {
  const { restaurants, current, user } = await dashContext((await searchParams).r, { allowStaff: true });
  const canEdit = user.role !== "STAFF" && !!current;
  const team = canEdit ? (await teamOf(current!.id)).map((u) => ({ ...u, createdAt: u.createdAt.toISOString() })) : [];
  return <TeamPage restaurant={current} restaurants={restaurants} me={{ id: user.id, email: user.email, role: user.role }} canEdit={canEdit} initial={team} />;
}
