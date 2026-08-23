"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Zap, Loader2, AlertCircle, CheckCircle2, Send, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { SearchRun } from "@/lib/types";
import type { FlaggedListing } from "@/lib/flaggedStore";

const STATUS_STEPS = [
  { at: 0,   label: "Starting scan…" },
  { at: 8,   label: "Connecting to Facebook Marketplace…" },
  { at: 20,  label: "Scraping listings…" },
  { at: 45,  label: "Evaluating deals with AI…" },
  { at: 70,  label: "Scoring and ranking results…" },
  { at: 88,  label: "Almost there…" },
];

interface SearchButtonProps {
  onSearchComplete: (flagged: FlaggedListing[]) => void;
  disabled?: boolean;
  location?: string;
  radius?: number;
}

export function SearchButton({ onSearchComplete, disabled, location, radius }: SearchButtonProps) {
  const [runId, setRunId] = useState<string | null>(null);
  const [status, setStatus] = useState<SearchRun["status"] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stepLabel, setStepLabel] = useState(STATUS_STEPS[0].label);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSent, setReviewSent] = useState(false);
  const [scanStatus, setScanStatus] = useState<{ scansUsed?: number; scanLimit?: number; unlimited?: boolean; tier?: string | null } | null>(null);

  function startProgressSimulation() {
    elapsedRef.current = 0;
    setProgress(0);
    setStepLabel(STATUS_STEPS[0].label);

    progressRef.current = setInterval(() => {
      elapsedRef.current += 1;
      const elapsed = elapsedRef.current;

      // Simulate progress: fast early, slows down toward 90
      const simulated = Math.min(90, Math.round(90 * (1 - Math.exp(-elapsed / 55))));
      setProgress(simulated);

      const currentStep = [...STATUS_STEPS].reverse().find((s) => simulated >= s.at);
      if (currentStep) setStepLabel(currentStep.label);
    }, 1000);
  }

  function stopProgressSimulation(success: boolean) {
    if (progressRef.current) clearInterval(progressRef.current);
    if (success) {
      setProgress(100);
      setStepLabel("Scan complete!");
    }
  }

  const pollStatus = useCallback(async (id: string) => {
    const res = await fetch(`/api/search/status?runId=${id}`);
    const data: SearchRun & { flagged?: FlaggedListing[] } = await res.json();
    if (data.status === "completed") {
      stopProgressSimulation(true);
      setStatus("completed");
      setLoading(false);
      onSearchComplete(data.flagged ?? []);
    } else if (data.status === "failed") {
      stopProgressSimulation(false);
      setStatus("failed");
      setErrorMsg(data.error_message ?? "Search failed");
      setLoading(false);
    }
  }, [onSearchComplete]);

  useEffect(() => {
    if (!runId || !loading) return;
    const interval = setInterval(() => pollStatus(runId), 5000);
    return () => clearInterval(interval);
  }, [runId, loading, pollStatus]);

  useEffect(() => {
    return () => { if (progressRef.current) clearInterval(progressRef.current); };
  }, []);

  useEffect(() => {
    fetch("/api/scan-status").then((r) => r.json()).then(setScanStatus).catch(() => {});
  }, [status]); // refresh after each scan completes

  async function handleSearch() {
    setLoading(true);
    setStatus("running");
    setErrorMsg(null);
    startProgressSimulation();

    const res = await fetch("/api/search/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location, radius_miles: radius }),
    });
    if (!res.ok) {
      const err = await res.json();
      stopProgressSimulation(false);
      setLoading(false);
      if (err.error === "scan_limit_reached") {
        setStatus(null);
        setShowLimitModal(true);
        return;
      }
      setStatus("failed");
      setErrorMsg(err.error ?? "Failed to start search");
      return;
    }
    const data = await res.json();
    setRunId(data.runId);
  }

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reviewText.trim()) return;
    setReviewSubmitting(true);
    await fetch("/api/scan-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ review: reviewText }),
    });
    setReviewSubmitting(false);
    setReviewSent(true);
  }

  return (
    <>
    {showLimitModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-zinc-900 shadow-2xl shadow-black/60 overflow-hidden">
          <div className="px-6 py-5 border-b border-white/[0.06] bg-zinc-800/60">
            <h2 className="text-lg font-bold text-white">Scan limit reached</h2>
            <p className="text-sm text-zinc-400 mt-1">You've used all your free trial scans.</p>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-sm text-zinc-300 leading-relaxed">
              Upgrade to keep scanning. Pro gives you 15 scans/month, Premium gives you unlimited.
            </p>
            <Link href="/pricing">
              <button className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-bold py-3 rounded-xl transition-colors">
                View plans <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
            <div className="border-t border-white/[0.06] pt-4">
              {reviewSent ? (
                <div className="flex flex-col items-center gap-2 py-2 text-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                  <p className="text-sm font-semibold text-white">Feedback sent!</p>
                  <p className="text-xs text-zinc-500">We'll be in touch shortly.</p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-zinc-500 mb-3">Or share your experience and we'll manually review your access:</p>
                  <form onSubmit={handleReviewSubmit} className="space-y-3">
                    <textarea
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Tell us how the app has been working for you..."
                      rows={3}
                      required
                      className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all resize-none"
                    />
                    <button
                      type="submit"
                      disabled={reviewSubmitting || !reviewText.trim()}
                      className="w-full flex items-center justify-center gap-2 bg-white/[0.06] hover:bg-white/[0.10] disabled:opacity-50 disabled:pointer-events-none text-white text-sm font-bold py-2.5 rounded-xl transition-colors"
                    >
                      <Send className="h-3.5 w-3.5" />
                      {reviewSubmitting ? "Submitting..." : "Submit feedback"}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    )}
    <div className="flex flex-col items-start sm:items-end gap-3 min-w-[220px]">
      <button
        onClick={handleSearch}
        disabled={loading || disabled}
        className="flex items-center gap-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none text-white text-sm font-black px-6 py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.99] shadow-lg shadow-primary/25 ring-1 ring-primary/20 self-end"
      >
        {loading
          ? <Loader2 className="h-4 w-4 animate-spin" />
          : <Zap className="h-4 w-4" />}
        {loading ? "Scanning…" : "Run Scan"}
      </button>

      {/* Scan usage indicator */}
      {!loading && scanStatus && !scanStatus.unlimited && scanStatus.scanLimit !== undefined && (
        <div className="flex items-center gap-2 self-end">
          <div className="h-1.5 w-24 rounded-full bg-white/[0.07] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                (scanStatus.scansUsed ?? 0) >= scanStatus.scanLimit
                  ? "bg-red-500"
                  : (scanStatus.scansUsed ?? 0) >= scanStatus.scanLimit * 0.66
                  ? "bg-amber-400"
                  : "bg-primary"
              }`}
              style={{ width: `${Math.min(100, ((scanStatus.scansUsed ?? 0) / scanStatus.scanLimit) * 100)}%` }}
            />
          </div>
          <span className="text-xs text-zinc-500 font-medium whitespace-nowrap">
            {scanStatus.scansUsed ?? 0} / {scanStatus.scanLimit} scans
            {scanStatus.tier === "pro" ? " this month" : " free"}
          </span>
        </div>
      )}
      {!loading && scanStatus?.unlimited && (
        <span className="text-xs text-zinc-500 font-medium self-end">Unlimited scans</span>
      )}

      {/* Progress bar */}
      {loading && (
        <div className="w-full space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-zinc-400 font-medium">{stepLabel}</span>
            <span className="text-[11px] font-mono text-zinc-500">{progress}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-white/[0.07] overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] text-zinc-600 italic">
            This may take a minute — hang tight! 🙂
          </p>
        </div>
      )}

      {status === "completed" && !loading && (
        <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Scan complete
        </span>
      )}

      {status === "failed" && errorMsg && (
        <span className="flex items-center gap-1.5 text-xs font-medium text-red-400">
          <AlertCircle className="h-3.5 w-3.5" />
          {errorMsg}
        </span>
      )}
    </div>
    </>
  );
}
