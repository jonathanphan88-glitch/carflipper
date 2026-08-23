import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: settings } = await supabase
    .from("user_settings")
    .select("scan_allowlisted, free_scan_limit, subscription_tier, subscription_status, subscription_period_start")
    .eq("user_id", user.id)
    .single();

  const allowlisted = settings?.scan_allowlisted === true;
  const tier = settings?.subscription_status === "active" ? settings?.subscription_tier : null;

  if (allowlisted || tier === "premium") {
    return NextResponse.json({ unlimited: true, tier: tier ?? "allowlisted" });
  }

  if (tier === "pro" && settings?.subscription_period_start) {
    const { data: scanRows } = await supabase
      .from("search_runs")
      .select("id")
      .eq("user_id", user.id)
      .gte("triggered_at", settings.subscription_period_start);
    return NextResponse.json({ scansUsed: scanRows?.length ?? 0, scanLimit: 15, tier: "pro" });
  }

  // Free trial
  const { data: scanRows } = await supabase
    .from("search_runs")
    .select("id")
    .eq("user_id", user.id);
  const freeLimit = settings?.free_scan_limit ?? 3;
  return NextResponse.json({ scansUsed: scanRows?.length ?? 0, scanLimit: freeLimit, tier: null });
}
