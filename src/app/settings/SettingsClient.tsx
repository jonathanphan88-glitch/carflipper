"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Slider } from "@/components/ui/slider";
import { CheckCircle, MapPin, DollarSign, Target, Bell, ChevronLeft, CreditCard, Zap, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { UserSettings } from "@/lib/types";

interface SettingsClientProps {
  initialSettings: UserSettings | null;
}

function Section({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#0f0f18] border border-white/[0.07] rounded-2xl overflow-hidden">
      <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/5">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              {icon}
            </div>
            <h3 className="font-bold text-sm text-white">{title}</h3>
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed">{description}</p>
        </div>
        <div className="md:col-span-2 p-6 space-y-5">
          {children}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block">
        {label}
      </label>
      {children}
    </div>
  );
}

function SubscriptionSection() {
  const [scanStatus, setScanStatus] = useState<{
    scansUsed?: number; scanLimit?: number; unlimited?: boolean; tier?: string | null;
  } | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    fetch("/api/scan-status").then((r) => r.json()).then(setScanStatus).catch(() => {});
  }, []);

  async function handleManageBilling() {
    setPortalLoading(true);
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    if (res.ok) {
      const { url } = await res.json();
      window.location.href = url;
    } else {
      setPortalLoading(false);
    }
  }

  const tierLabel = scanStatus?.tier === "premium" ? "Premium" : scanStatus?.tier === "pro" ? "Pro" : scanStatus?.tier === "allowlisted" ? "Admin" : "Free Trial";
  const tierColor = scanStatus?.tier === "premium" ? "text-primary" : scanStatus?.tier === "pro" ? "text-sky-400" : "text-zinc-400";
  const hasSub = scanStatus?.tier === "pro" || scanStatus?.tier === "premium";

  return (
    <div className="bg-[#0f0f18] border border-white/[0.07] rounded-2xl overflow-hidden">
      <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/5">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <CreditCard className="h-4 w-4" />
            </div>
            <h3 className="font-bold text-sm text-white">Subscription</h3>
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed">Your current plan and scan usage.</p>
        </div>
        <div className="md:col-span-2 p-6 space-y-5">
          {/* Plan badge */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-1">Current Plan</p>
              <p className={`text-xl font-black ${tierColor}`}>{tierLabel}</p>
            </div>
            {!hasSub && (
              <Link href="/pricing">
                <button className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors">
                  Upgrade <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </Link>
            )}
          </div>

          {/* Scan usage */}
          {scanStatus && (
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-2">Scan Usage</p>
              {scanStatus.unlimited ? (
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="text-sm text-white font-semibold">Unlimited scans</span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-300">{scanStatus.scansUsed ?? 0} scans used</span>
                    <span className="text-zinc-500">{scanStatus.scanLimit} {scanStatus.tier === "pro" ? "this month" : "total"}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/[0.07] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        (scanStatus.scansUsed ?? 0) >= (scanStatus.scanLimit ?? 0)
                          ? "bg-red-500"
                          : (scanStatus.scansUsed ?? 0) >= (scanStatus.scanLimit ?? 0) * 0.66
                          ? "bg-amber-400"
                          : "bg-primary"
                      }`}
                      style={{ width: `${Math.min(100, ((scanStatus.scansUsed ?? 0) / (scanStatus.scanLimit ?? 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Manage billing */}
          {hasSub && (
            <div className="pt-2 border-t border-white/5">
              <p className="text-xs text-zinc-500 mb-3">Manage your billing, update payment method, or cancel your subscription.</p>
              <button
                onClick={handleManageBilling}
                disabled={portalLoading}
                className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg border border-white/10 text-zinc-300 hover:text-white hover:border-white/20 disabled:opacity-50 transition-colors"
              >
                <CreditCard className="h-3.5 w-3.5" />
                {portalLoading ? "Redirecting..." : "Manage billing"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function SettingsClient({ initialSettings }: SettingsClientProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [location, setLocation] = useState(initialSettings?.location ?? "");
  const [radiusMiles, setRadiusMiles] = useState(initialSettings?.radius_miles ?? 50);
  const [priceMin, setPriceMin] = useState(initialSettings?.price_min ?? 0);
  const [priceMax, setPriceMax] = useState(initialSettings?.price_max ?? 15000);
  const [minProfit, setMinProfit] = useState(initialSettings?.min_profit ?? 1000);
  const [minScore, setMinScore] = useState(initialSettings?.min_score ?? 50);
  const [emailAlerts, setEmailAlerts] = useState(initialSettings?.email_alerts_enabled ?? true);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location,
        radius_miles: radiusMiles,
        price_min: priceMin,
        price_max: priceMax,
        min_profit: minProfit,
        min_score: minScore,
        email_alerts_enabled: emailAlerts,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      setError(err.error ?? "Failed to save settings");
    } else {
      setSaved(true);
      router.refresh();
    }
    setSaving(false);
  }

  return (
    <div className="space-y-3">
    <SubscriptionSection />
    <form onSubmit={handleSave} className="space-y-3">

      {/* Location */}
      <Section
        icon={<MapPin className="h-4 w-4" />}
        title="Search Location"
        description="Where should we scan Facebook Marketplace for deals?"
      >
        <Field label="City or ZIP code">
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Los Angeles, CA"
            required
            className="w-full h-11 bg-[#1a1a26] border border-white/[0.08] rounded-xl px-4 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </Field>

        <Field label={`Search radius · ${radiusMiles} miles`}>
          <div className="pt-1">
            <Slider
              min={10} max={200} step={10}
              value={[radiusMiles]}
              onValueChange={(v) => { const n = Array.isArray(v) ? v[0] : v; if (n !== undefined) setRadiusMiles(n); }}
            />
            <div className="flex justify-between text-[10px] text-zinc-600 mt-1.5">
              <span>10 mi</span><span>200 mi</span>
            </div>
          </div>
        </Field>
      </Section>

      {/* Budget */}
      <Section
        icon={<DollarSign className="h-4 w-4" />}
        title="Budget"
        description="Your buy price range. Only listings within this range will be shown."
      >
        <Field label={`Price range · $${priceMin.toLocaleString()} – $${priceMax.toLocaleString()}`}>
          <div className="pt-1">
            <Slider
              min={0} max={50000} step={500}
              value={[priceMin, priceMax]}
              onValueChange={(v) => {
                const arr = Array.isArray(v) ? v : [v];
                if (arr[0] !== undefined) setPriceMin(arr[0]);
                if (arr[1] !== undefined) setPriceMax(arr[1]);
              }}
            />
            <div className="flex justify-between text-[10px] text-zinc-600 mt-1.5">
              <span>$0</span><span>$50,000</span>
            </div>
          </div>
        </Field>
      </Section>

      {/* Deal thresholds */}
      <Section
        icon={<Target className="h-4 w-4" />}
        title="Deal Thresholds"
        description="Listings that don't meet these minimums are automatically excluded from your feed."
      >
        <Field label={`Min estimated profit · $${minProfit.toLocaleString()}`}>
          <div className="pt-1">
            <Slider
              min={0} max={10000} step={250}
              value={[minProfit]}
              onValueChange={(v) => { const n = Array.isArray(v) ? v[0] : v; if (n !== undefined) setMinProfit(n); }}
            />
            <div className="flex justify-between text-[10px] text-zinc-600 mt-1.5">
              <span>$0</span><span>$10,000</span>
            </div>
          </div>
        </Field>

        <Field label={`Min deal score · ${minScore}/100`}>
          <div className="pt-1">
            <Slider
              min={0} max={100} step={5}
              value={[minScore]}
              onValueChange={(v) => { const n = Array.isArray(v) ? v[0] : v; if (n !== undefined) setMinScore(n); }}
            />
            <div className="flex justify-between text-[10px] text-zinc-600 mt-1.5">
              <span>0</span><span>100</span>
            </div>
          </div>
        </Field>
      </Section>

      {/* Notifications */}
      <Section
        icon={<Bell className="h-4 w-4" />}
        title="Email Alerts"
        description="Receive a digest after each scan with your top new deals."
      >
        <button
          type="button"
          onClick={() => setEmailAlerts(!emailAlerts)}
          className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 transition-colors duration-200 focus:outline-none ${
            emailAlerts ? "bg-primary border-primary" : "bg-zinc-700 border-zinc-700"
          }`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 mt-0.5 ${emailAlerts ? "translate-x-5" : "translate-x-0.5"}`} />
        </button>
        <p className="text-xs text-zinc-500 mt-2">
          {emailAlerts ? "Email alerts enabled — you'll receive deal digests after each scan." : "Email alerts are off."}
        </p>
      </Section>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2">
        <Link href="/dashboard">
          <button type="button" className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-white transition-colors">
            <ChevronLeft className="h-4 w-4" />
            Back to dashboard
          </button>
        </Link>

        <div className="flex items-center gap-4">
          {error && (
            <span className="text-sm text-red-400">{error}</span>
          )}
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-400">
              <CheckCircle className="h-4 w-4" />
              Saved
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground text-sm font-black px-6 py-2.5 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.99]"
          >
            {saving ? "Saving..." : "Save settings"}
          </button>
        </div>
      </div>
    </form>
    </div>
  );
}
