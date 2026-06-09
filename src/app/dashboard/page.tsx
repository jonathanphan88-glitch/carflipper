import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { DashboardClient } from "./DashboardClient";
import type { UserSettings } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: settings } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-background">
      <Navbar userEmail={user.email} />
      <main className="max-w-7xl mx-auto px-6 py-6">
        <DashboardClient initialSettings={settings as UserSettings | null} />
      </main>
    </div>
  );
}
