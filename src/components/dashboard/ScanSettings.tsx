"use client";

import { useState } from "react";
import { Settings2, CheckCircle, Loader2, MapPin } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import type { UserSettings } from "@/lib/types";

interface ScanSettingsProps {
  initialSettings: UserSettings | null;
  onSaved: () => void;
}

export function ScanSettings({ initialSettings, onSaved }: ScanSettingsProps) {
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useState(initialSettings?.location ?? "");
  const [radius, setRadius] = useState(initialSettings?.radius_miles ?? 50);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        radius_miles: radius,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      setError(err.error ?? "Failed to save");
    } else {
      setSaved(true);
      onSaved();
      setTimeout(() => { setSaved(false); setOpen(false); }, 1200);
    }
    setSaving(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
          open
            ? "border-primary/40 bg-primary/10 text-primary"
            : "border-white/10 bg-white/[0.04] text-zinc-400 hover:text-white hover:border-white/20"
        }`}
      >
        <Settings2 className="h-4 w-4" />
        {initialSettings?.location ? (
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3 w-3" />
            {initialSettings.location}
          </span>
        ) : (
          "Configure"
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Panel */}
          <form
            onSubmit={handleSave}
            className="absolute right-0 top-full mt-2 z-50 w-80 rounded-2xl border border-white/10 bg-[oklch(0.18_0.007_265)] shadow-2xl shadow-black/50 p-5 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="text-sm font-bold text-white mb-0.5">Scan Settings</h3>
              <p className="text-xs text-zinc-500">Configure your search location and budget.</p>
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 block">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. San Jose, CA"
                required
                className="w-full h-9 bg-white/[0.05] border border-white/10 rounded-xl px-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
              />
            </div>

            {/* Radius */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Radius</label>
                <span className="text-xs font-mono text-zinc-300">{radius} mi</span>
              </div>
              <Slider
                min={10} max={200} step={10}
                value={[radius]}
                onValueChange={(v) => { const n = Array.isArray(v) ? v[0] : v; if (n !== undefined) setRadius(n); }}
              />
            </div>

            {error &&<p className="text-xs text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white text-sm font-semibold py-2 rounded-xl transition-colors"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle className="h-4 w-4" /> : null}
              {saving ? "Saving..." : saved ? "Saved!" : "Save"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
