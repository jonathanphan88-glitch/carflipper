import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-06-30.basil",
});

export const PLANS = {
  pro: {
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    name: "Pro",
    price: 19.99,
    scansPerMonth: 15,
  },
  premium: {
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID!,
    name: "Premium",
    price: 49.99,
    scansPerMonth: null, // unlimited
  },
} as const;

export type PlanTier = keyof typeof PLANS;
