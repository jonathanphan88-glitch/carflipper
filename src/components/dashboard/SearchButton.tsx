"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Zap, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
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
      setStatus("failed");
      setErrorMsg(err.error ?? "Failed to start search");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setRunId(data.runId);
  }

  return (
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
  );
}
