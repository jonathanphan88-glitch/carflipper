"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Zap, Check } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) { setError(error.message); setLoading(false); return; }
    setSuccess(true);
    setLoading(false);
    setTimeout(() => router.push("/dashboard"), 1500);
  }

  return (
    <div className="min-h-screen bg-zinc-800 flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-96 shrink-0 bg-zinc-700 border-r border-white/5 p-10">
        <div className="font-black text-xl tracking-tight">
          <span className="text-primary">Flip</span>
          <span className="text-white">Finder</span>
        </div>

        <div className="space-y-5">
          <h2 className="text-xl font-black text-white">Find deals others miss.</h2>
          <ul className="space-y-3">
            {[
              "Scan Facebook Marketplace on demand",
              "Score every listing by profit potential",
              "Filter by price, mileage, and condition",
              "Get email digests of top deals",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-zinc-400">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 text-primary" />
                </div>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="p-4 rounded-xl bg-zinc-600/50 border border-white/5">
          <div className="text-xs text-zinc-500 mb-1">Average deal found</div>
          <div className="text-2xl font-black text-emerald-400">+$2,800</div>
          <div className="text-xs text-zinc-600 mt-0.5">estimated profit per listing</div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden font-black text-xl tracking-tight mb-8">
            <span className="text-primary">Flip</span>
            <span className="text-white">Finder</span>
          </div>

          <div className="mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Create your account</h1>
            <p className="text-zinc-500 text-sm mt-1">Free to start — no credit card required</p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-500/8 border border-red-500/20 text-sm text-red-400">{error}</div>
          )}
          {success && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20 text-sm text-emerald-400">
              Account created! Redirecting to dashboard...
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full h-11 bg-zinc-700 border border-white/8 rounded-xl px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                minLength={8}
                required
                className="w-full h-11 bg-zinc-700 border border-white/8 rounded-xl px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground text-sm font-black h-11 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] mt-2"
            >
              {loading ? "Creating account..." : <>Create account <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <p className="text-sm text-zinc-500 text-center mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
