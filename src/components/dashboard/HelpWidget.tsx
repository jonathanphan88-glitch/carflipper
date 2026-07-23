"use client";

import { useState, useEffect } from "react";
import { HelpCircle, X, Send, CheckCircle2, ChevronDown } from "lucide-react";

interface HelpWidgetProps {
  currentLocation?: string;
  scanCount?: number;
}

export function HelpWidget({ currentLocation, scanCount }: HelpWidgetProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (scanCount && scanCount > 0) setOpen(true);
  }, [scanCount]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    setError(null);

    const res = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, locationValue: currentLocation }),
    });

    if (!res.ok) {
      setError("Failed to send. Please try again.");
      setSending(false);
      return;
    }

    setSent(true);
    setSending(false);
    setTimeout(() => { setOpen(false); setSent(false); setMessage(""); }, 2500);
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

      {/* Panel */}
      {open && (
        <div className="w-80 rounded-2xl border border-white/[0.08] bg-zinc-900 shadow-2xl shadow-black/60 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-zinc-800/60">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-primary" />
              <span className="text-base font-bold text-white">Having trouble?</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {sent ? (
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                <p className="text-sm font-semibold text-white">Message sent!</p>
                <p className="text-xs text-zinc-500">We'll look into it shortly.</p>
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    Are you seeing listings from the wrong location? Let us know what's happening and we'll fix it.
                  </p>
                  {currentLocation && (
                    <div className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-2.5 py-1.5 w-fit">
                      <span className="text-xs text-zinc-500">Your location:</span>
                      <span className="text-xs font-semibold text-zinc-300">{currentLocation}</span>
                    </div>
                  )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                      Describe the issue
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="e.g. I entered 92703 but I'm seeing listings from Virginia..."
                      rows={3}
                      required
                      className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all resize-none"
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-red-400">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={sending || !message.trim()}
                    className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none text-white text-sm font-bold py-2.5 rounded-xl transition-colors"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {sending ? "Sending..." : "Send message"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-3 bg-zinc-800 hover:bg-zinc-700 border border-white/[0.08] text-zinc-300 text-base font-semibold px-6 py-3.5 rounded-full shadow-xl transition-all hover:scale-[1.02]"
      >
        <HelpCircle className="h-6 w-6 text-primary" />
        Help
        <ChevronDown className={`h-5 w-5 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
    </div>
  );
}
