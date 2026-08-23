import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { stripe, PLANS, type PlanTier } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { plan } = await request.json() as { plan: PlanTier };
  if (!PLANS[plan]) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

  const serviceClient = await createServiceClient();
  const { data: settings } = await serviceClient
    .from("user_settings")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .single();

  let customerId = settings?.stripe_customer_id as string | undefined;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { user_id: user.id },
    });
    customerId = customer.id;
    await serviceClient.from("user_settings").upsert(
      { user_id: user.id, stripe_customer_id: customerId },
      { onConflict: "user_id" }
    );
  }

  const origin = request.headers.get("origin") ?? "https://carflip.autos";
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: PLANS[plan].priceId, quantity: 1 }],
    success_url: `${origin}/dashboard?subscribed=true`,
    cancel_url: `${origin}/pricing`,
    metadata: { user_id: user.id, plan },
  });

  return NextResponse.json({ url: session.url });
}
