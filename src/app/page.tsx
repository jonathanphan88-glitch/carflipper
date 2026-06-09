import Link from "next/link";
import { ArrowRight, Zap, TrendingUp, Bell, Check } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-800 text-white flex flex-col">

      {/* Nav */}
      <nav className="border-b border-white/5 sticky top-0 z-50 bg-zinc-800/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-black text-lg tracking-tight">
            <span className="text-primary">Flip</span>
            <span className="text-white">Finder</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <button className="text-sm font-medium text-zinc-400 hover:text-white transition-colors px-3 py-1.5">
                Sign in
              </button>
            </Link>
            <Link href="/signup">
              <button className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold px-4 py-2 rounded-xl transition-colors">
                Get started
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-primary/8 rounded-full blur-[150px]" />
            <div className="absolute top-32 left-1/4 w-[300px] h-[300px] bg-blue-600/5 rounded-full blur-[100px]" />
          </div>

          <div className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
            <div className="inline-flex items-center gap-2 border border-primary/20 bg-primary/5 text-primary text-xs font-bold px-4 py-1.5 rounded-full mb-10 uppercase tracking-widest">
              <Zap className="h-3 w-3" />
              Live Facebook Marketplace scanning
            </div>

            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] mb-6">
              Stop scrolling.<br />
              <span className="text-primary">Find the flip.</span>
            </h1>

            <p className="text-lg text-zinc-400 max-w-lg mx-auto mb-10 leading-relaxed">
              We score every car listing by profit potential, mileage, and condition.
              You only see the deals worth acting on.
            </p>

            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link href="/signup">
                <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-base font-black px-8 py-3.5 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.99] shadow-xl shadow-primary/20">
                  Start for free
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
              <Link href="/login">
                <button className="text-base font-medium text-zinc-400 hover:text-white px-6 py-3.5 transition-colors">
                  Sign in →
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* Fake deal card preview */}
        <section className="max-w-3xl mx-auto px-6 pb-20">
          <div className="relative rounded-2xl border border-white/8 bg-zinc-700 overflow-hidden shadow-2xl shadow-black/60">
            <div className="w-0.5 absolute left-0 inset-y-0 bg-emerald-500" />
            <div className="flex">
              <div className="w-52 shrink-0 bg-zinc-600 relative">
                <div className="w-full h-full min-h-[140px] flex items-center justify-center text-6xl opacity-10 select-none">🚗</div>
                <div className="absolute bottom-2 left-2 rounded-xl px-2.5 py-1.5 bg-black/60 border border-emerald-500/25">
                  <div className="text-xl font-black text-emerald-400">82</div>
                  <div className="text-[9px] text-white/40 uppercase tracking-wide">score</div>
                </div>
                <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">New</div>
              </div>
              <div className="flex-1 p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="font-bold text-sm text-white/90">2019 Honda Civic · Sport Sedan</div>
                    <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md border bg-emerald-500/10 text-emerald-400 border-emerald-500/25">Great Deal</span>
                  </div>
                  <div className="text-xs text-zinc-500 mb-4">87,000 mi · Tampa, FL · 2h ago</div>
                  <div className="flex items-end gap-6">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Asking Price</div>
                      <div className="text-3xl font-black text-white">$11,500</div>
                    </div>
                    <div className="mb-1">
                      <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Market Value</div>
                      <div className="text-lg font-semibold text-zinc-400">$15,200</div>
                    </div>
                    <div className="ml-auto mb-0.5 px-4 py-2.5 rounded-xl border bg-emerald-500/8 border-emerald-500/20">
                      <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Est. Profit</div>
                      <div className="text-xl font-black text-emerald-400">+$3,700</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-3 border-t border-white/5 mt-3">
                  <button className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-bold px-4 py-2 rounded-lg">View listing</button>
                  <button className="text-xs font-medium px-3 py-2 rounded-lg border border-white/8 text-zinc-400">Save</button>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-2 text-center text-xs text-zinc-600">Example listing from a real scan</div>
        </section>

        {/* Features */}
        <section className="max-w-6xl mx-auto px-6 pb-24">
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                icon: <Zap className="h-5 w-5 text-primary" />,
                title: "On-demand scan",
                desc: "Hit scan and get fresh Facebook Marketplace listings in under a minute. No scheduling, no waiting.",
                checks: ["Facebook Marketplace", "Filters by price & radius", "Removes duplicates"],
              },
              {
                icon: <TrendingUp className="h-5 w-5 text-primary" />,
                title: "Deal scoring",
                desc: "Every listing gets a 0–100 score based on four factors so you can prioritize instantly.",
                checks: ["Price vs. market value", "Mileage vs. age", "Condition keywords"],
              },
              {
                icon: <Bell className="h-5 w-5 text-primary" />,
                title: "Email alerts",
                desc: "After every scan, get a digest of your top deals straight to your inbox.",
                checks: ["Top 5 deals per email", "Photo + price + profit", "Direct listing links"],
              },
            ].map(({ icon, title, desc, checks }) => (
              <div key={title} className="bg-zinc-700 border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  {icon}
                </div>
                <h3 className="font-bold text-base text-white mb-2">{title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed mb-4">{desc}</p>
                <ul className="space-y-1.5">
                  {checks.map((c) => (
                    <li key={c} className="flex items-center gap-2 text-xs text-zinc-500">
                      <Check className="h-3 w-3 text-primary shrink-0" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-6xl mx-auto px-6 pb-24">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/15 p-12 text-center">
            <div className="absolute inset-0 -z-10">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/8 to-transparent" />
            </div>
            <h2 className="text-4xl font-black tracking-tight mb-3">Ready to find your next flip?</h2>
            <p className="text-zinc-400 mb-8 text-lg">Free to start. No credit card required.</p>
            <Link href="/signup">
              <button className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-base font-black px-8 py-3.5 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.99] shadow-xl shadow-primary/20">
                Get started free
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 py-6 text-center text-xs text-zinc-600">
        © {new Date().getFullYear()} FlipFinder
      </footer>
    </div>
  );
}
