import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { message, locationValue } = await request.json();
  if (!message?.trim()) return NextResponse.json({ error: "Message is required" }, { status: 400 });

  const serviceClient = await createServiceClient();

  const { error } = await serviceClient.from("support_messages").insert({
    user_id: user.id,
    user_email: user.email,
    location_value: locationValue ?? null,
    message: message.trim(),
  });

  if (error) {
    console.error("[support] insert failed:", error.message);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }

  console.log(`[support] message from ${user.email} | location: ${locationValue} | msg: ${message.trim()}`);

  return NextResponse.json({ ok: true });
}
