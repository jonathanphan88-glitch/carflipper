import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";
import type Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("[webhook] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const serviceClient = await createServiceClient();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;
    const plan = session.metadata?.plan;
    if (!userId || !plan) return NextResponse.json({ ok: true });

    const subscription = await stripe.subscriptions.retrieve(session.subscription as string) as unknown as { current_period_start: number; current_period_end: number };
    await serviceClient.from("user_settings").upsert({
      user_id: userId,
      stripe_customer_id: session.customer as string,
      subscription_tier: plan,
      subscription_status: "active",
      subscription_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      subscription_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    }, { onConflict: "user_id" });

    console.log(`[webhook] subscription activated: user=${userId} plan=${plan}`);
  }

  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object as Stripe.Subscription & { current_period_start: number; current_period_end: number };
    const customerId = subscription.customer as string;
    const { data: settings } = await serviceClient
      .from("user_settings")
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .single();
    if (!settings) return NextResponse.json({ ok: true });

    await serviceClient.from("user_settings").update({
      subscription_status: subscription.status === "active" ? "active" : "canceled",
      subscription_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      subscription_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    }).eq("stripe_customer_id", customerId);

    console.log(`[webhook] subscription updated: customer=${customerId} status=${subscription.status}`);
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = subscription.customer as string;
    await serviceClient.from("user_settings").update({
      subscription_status: "canceled",
      subscription_tier: null,
    }).eq("stripe_customer_id", customerId);

    console.log(`[webhook] subscription canceled: customer=${customerId}`);
  }

  return NextResponse.json({ ok: true });
}
