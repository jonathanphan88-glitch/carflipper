import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: states } = await supabase
    .from("user_listing_states")
    .select("listing_id")
    .eq("user_id", user.id);

  if (!states?.length) return NextResponse.json({ makes: [] });

  const listingIds = states.map((s) => s.listing_id);

  const { data: rows } = await supabase
    .from("listings")
    .select("make")
    .in("id", listingIds)
    .not("make", "is", null);

  const makes = [...new Set(rows?.map((r) => r.make).filter(Boolean) as string[])]
    .sort((a, b) => a.localeCompare(b));

  return NextResponse.json({ makes });
}
