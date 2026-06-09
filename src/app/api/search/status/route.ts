import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getFlagged } from "@/lib/flaggedStore";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const runId = request.nextUrl.searchParams.get("runId");

  if (runId) {
    const { data } = await supabase
      .from("search_runs")
      .select("*")
      .eq("id", runId)
      .eq("user_id", user.id)
      .single();
    if (!data) return NextResponse.json({ error: "Not found" });
    return NextResponse.json({ ...data, flagged: getFlagged(runId) });
  }

  // Return most recent run
  const { data } = await supabase
    .from("search_runs")
    .select("*")
    .eq("user_id", user.id)
    .order("triggered_at", { ascending: false })
    .limit(1)
    .single();

  return NextResponse.json(data ?? null);
}
