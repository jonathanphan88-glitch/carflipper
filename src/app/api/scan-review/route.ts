import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { review } = await request.json();
  if (!review?.trim()) return NextResponse.json({ error: "Review is required" }, { status: 400 });

  const serviceClient = await createServiceClient();
  const { error } = await serviceClient.from("scan_reviews").insert({
    user_id: user.id,
    user_email: user.email,
    review: review.trim(),
  });

  if (error) {
    console.error("[scan-review] insert failed:", error.message);
    return NextResponse.json({ error: "Failed to save review" }, { status: 500 });
  }

  console.log(`[scan-review] review from ${user.email}: ${review.trim()}`);
  return NextResponse.json({ ok: true });
}
