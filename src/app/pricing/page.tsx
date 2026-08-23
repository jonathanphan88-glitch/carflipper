"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Zap, ArrowRight } from "lucide-react";

const PLANS = [
  {
    id: "pro",
    name: "Pro",
    price: 19.99,
    description: "Great for casual flippers",
    scans: "15 scans / month",
    features: [
      "15 scans per month",
      "AI-powered deal scoring",
      "PDF export",
      "Save & dismiss listings",
      "Filter by price, mileage, year",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 49.99,
    description: "For serious flippers who scan daily",
    scans: "Unlimited scans",
    features: [
      "Unlimited scans",
      "AI-powered deal scoring",
      "PDF export",
      "Save & dismiss listings",
      "Filter by price, mileage, year",
      "Priority support",
    ],
    highlight: true,
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleSubscribe(planId: string) {
    setLoading(planId);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: planId }),
    });
    if (!res.ok) {
      const err = await res.json();
      if (err.error === "Unauthorized") { router.push("/login"); return; }
      setLoading(null);
      return;
    }
    const { url } = await res.json();
    window.location.href = url;
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white flex flex-col items-center justify-center px-6 py-20">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 border border-primary/20 bg-primary/5 text-primary text-xs font-bold px-4 py-1.5 rounded-full mb-6 uppercase tracking-widest">
          <Zap className="h-3 w-3" />
          Choose your plan
        </div>
        <h1 className="text-5xl font-black tracking-tight mb-3">Simple pricing</h1>
        <p className="text-zinc-400 text-lg">Start finding profitable flips today.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6 w-full max-w-3xl">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-2xl border p-8 flex flex-col gap-6 ${
              plan.highlight
                ? "border-primary/40 bg-primary/5 shadow-2xl shadow-primary/10"
                : "border-white/[0.08] bg-zinc-800/60"
            }`}
          >
            {plan.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-black px-4 py-1 rounded-full uppercase tracking-widest">
                Most popular
              </div>
            )}

            <div>
              <h2 className="text-xl font-black text-white">{plan.name}</h2>
              <p className="text-sm text-zinc-400 mt-1">{plan.description}</p>
            </div>

            <div>
              <span className="text-5xl font-black text-white">${plan.price}</span>
              <span className="text-zinc-400 text-sm ml-1">/month</span>
              <p className="text-sm text-primary font-semibold mt-1">{plan.scans}</p>
            </div>

            <ul className="space-y-2.5 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-zinc-300">
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe(plan.id)}
              disabled={loading === plan.id}
              className={`w-full flex items-center justify-center gap-2 text-sm font-black py-3 rounded-xl transition-all disabled:opacity-60 ${
                plan.highlight
                  ? "bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
                  : "bg-white/[0.08] hover:bg-white/[0.12] text-white"
              }`}
            >
              {loading === plan.id ? "Redirecting..." : <>Get {plan.name} <ArrowRight className="h-4 w-4" /></>}
            </button>
          </div>
        ))}
      </div>

      <p className="text-zinc-600 text-sm mt-10">Cancel anytime. No hidden fees.</p>
    </div>
  );
}
