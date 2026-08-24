"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Zap, ArrowRight, Lock } from "lucide-react";
import Link from "next/link";

const PLANS = [
  {
    id: "pro",
    name: "Pro",
    price: 19.99,
    description: "For casual flippers scanning a few times a month.",
    scans: "15 scans / month",
    features: [
      "15 scans per month",
      "AI deal scoring (0–100)",
      "PDF export",
      "Save & dismiss listings",
      "Filter by price, mileage, year",
    ],
    highlight: false,
  },
  {
    id: "premium",
    name: "Premium",
    price: 49.99,
    description: "For serious flippers who scan daily and move fast.",
    scans: "Unlimited scans",
    features: [
      "Unlimited scans",
      "AI deal scoring (0–100)",
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
    <div className="min-h-screen bg-[#09090f] text-white flex flex-col">

      {/* Nav */}
      <nav className="border-b border-white/[0.06] sticky top-0 z-50 bg-[#09090f]/90 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <div className="font-black text-2xl tracking-tight">
              <span className="text-primary">Car</span>
              <span className="text-white">Flip</span>
            </div>
          </Link>
          <Link href="/dashboard">
            <button className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
              Back to dashboard
            </button>
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20">

        {/* Header */}
        <div className="text-center mb-14 max-w-lg">
          <div className="inline-flex items-center gap-2 border border-primary/20 bg-primary/5 text-primary text-xs font-semibold px-4 py-1.5 rounded-full mb-6 tracking-wide">
            <Zap className="h-3 w-3" />
            Simple pricing
          </div>
          <h1 className="text-5xl font-black tracking-tight mb-3">Find more flips.</h1>
          <p className="text-zinc-400 text-base leading-relaxed">Start finding profitable deals today. Cancel anytime.</p>
        </div>

        {/* Plans */}
        <div className="grid sm:grid-cols-2 gap-5 w-full max-w-2xl">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl flex flex-col gap-6 p-7 transition-all ${
                plan.highlight
                  ? "border-2 border-primary/35 bg-gradient-to-b from-primary/8 to-[#0f0f18] shadow-2xl shadow-primary/10 ring-1 ring-primary/10"
                  : "border border-white/[0.08] bg-[#0f0f18]"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-black px-5 py-1 rounded-full tracking-wide shadow-lg shadow-primary/30">
                  Most popular
                </div>
              )}

              <div>
                <h2 className={`text-lg font-black mb-1 ${plan.highlight ? "text-white" : "text-zinc-200"}`}>{plan.name}</h2>
                <p className="text-sm text-zinc-500 leading-snug">{plan.description}</p>
              </div>

              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black text-white">${plan.price}</span>
                  <span className="text-zinc-500 text-sm">/month</span>
                </div>
                <p className={`text-sm font-semibold mt-1.5 ${plan.highlight ? "text-primary" : "text-zinc-400"}`}>
                  {plan.scans}
                </p>
              </div>

              <ul className="space-y-2.5 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-zinc-300">
                    <Check className={`h-3.5 w-3.5 shrink-0 ${plan.highlight ? "text-primary" : "text-zinc-500"}`} />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={loading === plan.id}
                className={`w-full flex items-center justify-center gap-2 text-sm font-black py-3 rounded-xl transition-all disabled:opacity-60 ${
                  plan.highlight
                    ? "bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99]"
                    : "bg-white/[0.07] hover:bg-white/[0.11] text-white border border-white/[0.08]"
                }`}
              >
                {loading === plan.id ? "Redirecting..." : <>Get {plan.name} <ArrowRight className="h-4 w-4" /></>}
              </button>
            </div>
          ))}
        </div>

        {/* Trust signals */}
        <div className="mt-10 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-zinc-600">
            <Lock className="h-3 w-3" />
            Secure checkout via Stripe · Cancel anytime · No hidden fees
          </div>
          <p className="text-xs text-zinc-700">
            Already have an account?{" "}
            <Link href="/login" className="text-zinc-500 hover:text-zinc-300 transition-colors underline">Sign in</Link>
          </p>
        </div>
      </main>

      <footer className="border-t border-white/[0.06] py-6">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-center gap-6 text-sm text-zinc-700">
          <Link href="/privacy" className="hover:text-zinc-400 transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-zinc-400 transition-colors">Terms</Link>
          <a href="mailto:support@carflip.autos" className="hover:text-zinc-400 transition-colors">Contact</a>
        </div>
      </footer>
    </div>
  );
}
