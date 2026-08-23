"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push("/dashboard");
    router.refresh();
  }

  async function handleGoogleLogin() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div className="min-h-screen bg-zinc-800 flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-96 shrink-0 bg-zinc-700 border-r border-white/5 p-10">
        <div className="font-black text-xl tracking-tight">
          <span className="text-primary">Flip</span>
          <span className="text-white">Finder</span>
        </div>

        <div className="space-y-6">
          {[
            { score: 82, title: "2019 Honda Civic Sport", price: "$11,500", profit: "+$3,700", color: "text-emerald-400", border: "border-emerald-500/20", bg: "bg-emerald-500/8" },
            { score: 67, title: "2015 Ford Mustang V6", price: "$8,200", profit: "+$1,900", color: "text-blue-400", border: "border-blue-500/20", bg: "bg-blue-500/8" },
            { score: 74, title: "2017 Subaru WRX", price: "$14,000", profit: "+$2,400", color: "text-blue-400", border: "border-blue-500/20", bg: "bg-blue-500/8" },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between gap-4 p-3 bg-zinc-600/50 border border-white/5 rounded-xl">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-sm ${item.bg} ${item.color} border ${item.border}`}>
                {item.score}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-white truncate">{item.title}</div>
                <div className="text-xs text-zinc-500">{item.price}</div>
              </div>
              <div className={`text-sm font-black ${item.color}`}>{item.profit}</div>
            </div>
          ))}
        </div>

        <div className="text-xs text-zinc-600">
          Find your next flip before anyone else does.
        </div>
      </div>

      {/* Right panel: form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden font-black text-xl tracking-tight mb-8">
            <span className="text-primary">Car</span>
            <span className="text-white">Flip</span>
          </div>

          <div className="mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Welcome back</h1>
            <p className="text-zinc-500 text-sm mt-1">Sign in to your account</p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-500/8 border border-red-500/20 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
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
                placeholder="••••••••"
                required
                className="w-full h-11 bg-zinc-700 border border-white/8 rounded-xl px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground text-sm font-black h-11 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] mt-2"
            >
              {loading ? "Signing in..." : <>Sign in <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/8" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-zinc-800 px-3 text-xs text-zinc-500">or</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 h-11 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white text-sm font-semibold transition-all"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <p className="text-sm text-zinc-500 text-center mt-6">
            No account?{" "}
            <Link href="/signup" className="text-primary font-semibold hover:underline">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
