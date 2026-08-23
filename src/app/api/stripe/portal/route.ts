import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serviceClient = await createServiceClient();
  const { data: settings } = await serviceClient
    .from("user_settings")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .single();

  if (!settings?.stripe_customer_id) {
    return NextResponse.json({ error: "No billing account found" }, { status: 400 });
  }

  const origin = request.headers.get("origin") ?? "https://carflip.autos";
  const session = await stripe.billingPortal.sessions.create({
    customer: settings.stripe_customer_id,
    return_url: `${origin}/settings`,
  });

  return NextResponse.json({ url: session.url });
}
