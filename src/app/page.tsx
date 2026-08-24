import Link from "next/link";
import { ArrowRight, Zap, TrendingUp, Bell, Check, Car } from "lucide-react";

const HOW_IT_WORKS = [
  {
    num: "01",
    title: "Set your location",
    desc: "Enter your city and a search radius. We scan Facebook Marketplace for cars listed within that area.",
  },
  {
    num: "02",
    title: "Run a scan",
    desc: "In under a minute we scrape live listings and run each one through an AI that estimates market value and flags deal quality.",
  },
  {
    num: "03",
    title: "Review your deals",
    desc: "See every listing scored 0–100 with asking price, estimated market value, and projected profit — ranked best first.",
  },
];

const FAQS = [
  {
    q: "Where does the market value estimate come from?",
    a: "We use an AI model to estimate fair market value for each listing based on year, make, model, mileage, trim, and condition keywords from the description.",
  },
  {
    q: "What areas are supported?",
    a: "Any zip code in the United States.",
  },
  {
    q: "Can I cancel my subscription?",
    a: "Yes, anytime. Go to Settings → Manage Billing and cancel with one click. You keep access through the end of your billing period.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#09090f] text-white flex flex-col">

      {/* Nav */}
      <nav className="border-b border-white/[0.06] sticky top-0 z-50 bg-[#09090f]/90 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-black text-2xl tracking-tight">
            <span className="text-primary">Car</span>
            <span className="text-white">Flip</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <button className="text-sm font-medium text-zinc-400 hover:text-white transition-colors px-3 py-1.5">
                Sign in
              </button>
            </Link>
            <Link href="/signup">
              <button className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold px-4 py-2 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99]">
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
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-primary/6 rounded-full blur-[160px]" />
          </div>

          <div className="max-w-6xl mx-auto px-6 pt-24 pb-16 text-center">
            <div className="inline-flex items-center gap-2 border border-primary/20 bg-primary/5 text-primary text-xs font-semibold px-4 py-1.5 rounded-full mb-8 tracking-wide">
              <Zap className="h-3 w-3" />
              Live Facebook Marketplace scanning
            </div>

            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] mb-6">
              Stop scrolling.<br />
              <span className="text-primary">Find the flip.</span>
            </h1>

            <p className="text-xl text-zinc-300 max-w-lg mx-auto mb-10 leading-relaxed">
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
                <button className="text-sm font-medium text-zinc-500 hover:text-white px-6 py-3.5 transition-colors">
                  Sign in →
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* Demo card */}
        <section className="max-w-3xl mx-auto px-6 pb-20">
          <div className="relative rounded-2xl border border-white/[0.08] bg-[#0f0f18] overflow-hidden shadow-2xl shadow-black/60">
            <div className="w-0.5 absolute left-0 inset-y-0 bg-emerald-500/60" />
            <div className="flex">
              <div className="w-52 shrink-0 relative bg-gradient-to-br from-[#0f0f18] to-[#080810]">
                <div className="w-full h-full min-h-[148px] flex items-center justify-center">
                  <Car className="h-14 w-14 text-white/[0.05]" strokeWidth={1} />
                </div>
                <div className="absolute bottom-2 left-2 rounded-xl px-2.5 py-1.5 bg-black/50 border border-emerald-500/20">
                  <div className="text-xl font-black text-emerald-400">82</div>
                  <div className="text-[9px] text-white/30 uppercase tracking-wide">score</div>
                </div>
                <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">New</div>
              </div>
              <div className="flex-1 p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="font-bold text-sm text-white/90">2019 Honda Civic · Sport Sedan</div>
                    <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/25">Great Deal</span>
                  </div>
                  <div className="text-xs text-zinc-600 mb-4">87,000 mi · Tampa, FL · 2h ago</div>
                  <div className="flex items-end gap-6">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">Asking Price</div>
                      <div className="text-3xl font-black text-white">$11,500</div>
                    </div>
                    <div className="mb-1">
                      <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">Market Value</div>
                      <div className="text-lg font-semibold text-zinc-400">$15,200</div>
                    </div>
                    <div className="ml-auto mb-0.5 px-4 py-2.5 rounded-xl bg-emerald-500/8 ring-1 ring-emerald-500/20">
                      <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">Est. Profit</div>
                      <div className="text-xl font-black text-emerald-400">+$3,700</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-3 border-t border-white/[0.05] mt-3">
                  <button className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-bold px-4 py-2 rounded-lg">View listing</button>
                  <button className="text-xs font-medium px-3 py-2 rounded-lg border border-white/[0.08] text-zinc-400">Save</button>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-2.5 text-center text-xs text-zinc-600">Example listing from a real scan</div>
        </section>

        {/* How it works */}
        <section className="max-w-6xl mx-auto px-6 pb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white tracking-tight mb-2">How it works</h2>
            <p className="text-zinc-500 text-base">Three steps from signup to finding your next flip.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.num} className="relative flex flex-col gap-4 p-6 rounded-2xl border border-white/[0.07] bg-[#0f0f18] hover:border-white/[0.12] transition-colors">
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <span className="text-xs font-black text-primary">{step.num}</span>
                </div>
                <h3 className="font-bold text-white text-base">{step.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
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
                desc: "Every listing gets a 0–100 score based on price vs. market, mileage, and condition so you can prioritize instantly.",
                checks: ["Price vs. market value", "Mileage vs. age", "Condition keywords"],
              },
              {
                icon: <Bell className="h-5 w-5 text-primary" />,
                title: "Email alerts",
                desc: "After every scan, get a digest of your top deals straight to your inbox.",
                checks: ["Top deals per email", "Photo + price + profit", "Direct listing links"],
              },
            ].map(({ icon, title, desc, checks }) => (
              <div key={title} className="bg-[#0f0f18] border border-white/[0.07] rounded-2xl p-6 hover:border-white/[0.12] transition-colors">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  {icon}
                </div>
                <h3 className="font-bold text-base text-white mb-2">{title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed mb-4">{desc}</p>
                <ul className="space-y-1.5">
                  {checks.map((c) => (
                    <li key={c} className="flex items-center gap-2 text-sm text-zinc-500">
                      <Check className="h-3 w-3 text-primary shrink-0" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto px-6 pb-24">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white tracking-tight mb-2">Common questions</h2>
          </div>
          <div className="divide-y divide-white/[0.06]">
            {FAQS.map((faq) => (
              <div key={faq.q} className="py-5">
                <h3 className="font-semibold text-white mb-2 text-sm">{faq.q}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-6xl mx-auto px-6 pb-24">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-primary/4 to-transparent border border-primary/12 p-12 text-center">
            <div className="absolute inset-0 -z-10">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/8 rounded-full blur-[120px]" />
            </div>
            <h2 className="text-4xl font-black tracking-tight mb-3">Ready to find your next flip?</h2>
            <p className="text-zinc-400 mb-8 text-base">Free to start · 3 scans included · No credit card required.</p>
            <Link href="/signup">
              <button className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-base font-black px-8 py-3.5 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.99] shadow-xl shadow-primary/20">
                Get started free
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="font-black text-lg tracking-tight">
            <span className="text-primary">Car</span><span className="text-white">Flip</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-zinc-600">
            <Link href="/privacy" className="hover:text-zinc-300 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-zinc-300 transition-colors">Terms</Link>
            <a href="mailto:support@carflip.autos" className="hover:text-zinc-300 transition-colors">Contact</a>
          </div>
          <p className="text-sm text-zinc-700">© {new Date().getFullYear()} CarFlip</p>
        </div>
      </footer>
    </div>
  );
}
