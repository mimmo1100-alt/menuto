import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import SetupForm from "./SetupForm";

export const dynamic = "force-dynamic";

export default async function Setup() {
  if ((await db.user.count()) > 0) redirect("/login");
  return <SetupForm />;
}
