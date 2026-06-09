import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: settings } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-zinc-800">
      <Navbar userEmail={user.email} />
      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-white">Settings</h1>
          <p className="text-zinc-500 text-sm mt-1">Configure your scan location, budget, and deal filters.</p>
        </div>
        <SettingsClient initialSettings={settings} />
      </main>
    </div>
  );
}
