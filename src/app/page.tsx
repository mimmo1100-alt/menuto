import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  redirect((await db.user.count()) === 0 ? "/setup" : "/login");
}
