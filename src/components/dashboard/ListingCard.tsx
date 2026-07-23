"use client";

import { useState } from "react";
import { ExternalLink, Bookmark, X, RotateCcw, Gauge, MapPin, TrendingUp, TrendingDown } from "lucide-react";
import type { ListingWithState, ListingStatus } from "@/lib/types";

interface ListingCardProps {
  listing: ListingWithState;
  onStatusChange: (id: string, status: ListingStatus) => void;
}

function scoreMeta(score: number | null) {
  if (score === null) return { label: "—", textColor: "text-zinc-400", ringColor: "ring-zinc-700", bgColor: "bg-zinc-800/60", badgeBg: "bg-zinc-800", badgeText: "text-zinc-500", badgeRing: "ring-white/5", tier: "none" };
  if (score >= 75) return { label: "Great Deal", textColor: "text-emerald-300", ringColor: "ring-emerald-500/50", bgColor: "bg-emerald-500/10", badgeBg: "bg-emerald-500/12", badgeText: "text-emerald-300", badgeRing: "ring-emerald-500/25", tier: "great" };
  if (score >= 50) return { label: "Fair Deal", textColor: "text-sky-300", ringColor: "ring-sky-500/50", bgColor: "bg-sky-500/10", badgeBg: "bg-sky-500/12", badgeText: "text-sky-300", badgeRing: "ring-sky-500/25", tier: "fair" };
  return { label: "Weak Deal", textColor: "text-zinc-400", ringColor: "ring-zinc-600/50", bgColor: "bg-zinc-800/60", badgeBg: "bg-zinc-800", badgeText: "text-zinc-500", badgeRing: "ring-white/5", tier: "weak" };
}

export function ListingCard({ listing, onStatusChange }: ListingCardProps) {
  const {
    id, title, year, make, model, price, market_value,
    estimated_profit, score, mileage, location, images, url, status, listed_at, raw_json,
  } = listing;

  const justification = raw_json?._llm_justification as string | null ?? null;

  const displayTitle = title ?? [year, make, model].filter(Boolean).join(" ") ?? "Unknown Vehicle";
  const imageUrl = images?.[0];
  const [imgError, setImgError] = useState(false);
  const profitPositive = estimated_profit !== null && estimated_profit > 0;
  const listedAgo = listed_at ? formatRelativeTime(new Date(listed_at)) : null;
  const sm = scoreMeta(score);

  const borderColor = sm.tier === "great"
    ? "border-emerald-500/25 hover:border-emerald-500/45"
    : sm.tier === "fair"
    ? "border-sky-500/20 hover:border-sky-500/40"
    : "border-white/[0.07] hover:border-white/[0.12]";

  return (
    <div className={`group relative flex overflow-hidden rounded-2xl border bg-[oklch(0.155_0.008_265)] transition-all duration-200 hover:shadow-2xl hover:shadow-black/50 hover:-translate-y-px ${borderColor}`}>

      {/* Image */}
      <div className="relative w-60 shrink-0 overflow-hidden bg-zinc-900">
        {imageUrl && !imgError ? (
          <img
            src={imageUrl}
            alt={displayTitle}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl opacity-10 select-none bg-gradient-to-br from-zinc-800 to-zinc-900">
            🚗
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {/* Score badge */}
        <div className={`absolute bottom-3 left-3 flex flex-col items-center justify-center w-[3.75rem] h-[3.75rem] rounded-2xl ring-2 ${sm.ringColor} ${sm.bgColor} backdrop-blur-sm shadow-xl`}>
          <span className={`text-2xl font-black leading-none ${sm.textColor}`}>{score ?? "—"}</span>
          <span className="text-[9px] font-bold text-white/25 uppercase tracking-wide leading-none mt-0.5">score</span>
        </div>

        {status === "new" && (
          <div className="absolute top-2.5 right-2.5 bg-primary text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest shadow-lg">
            New
          </div>
        )}
        {status === "saved" && (
          <div className="absolute top-2.5 right-2.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest backdrop-blur-sm">
            Saved
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col min-w-0 p-5 gap-3.5">

        {/* Title row */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-bold text-base text-white leading-snug truncate">{displayTitle}</h3>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              {mileage && (
                <span className="flex items-center gap-1.5 text-sm text-zinc-400">
                  <Gauge className="h-3.5 w-3.5 text-zinc-500" />{mileage.toLocaleString()} mi
                </span>
              )}
              {location && (
                <span className="flex items-center gap-1.5 text-sm text-zinc-400">
                  <MapPin className="h-3.5 w-3.5 text-zinc-500" />{location}
                </span>
              )}
              {listedAgo && <span className="text-sm text-zinc-600">{listedAgo}</span>}
            </div>
          </div>
          <span className={`shrink-0 text-sm font-bold px-3 py-1.5 rounded-lg ring-1 ${sm.badgeBg} ${sm.badgeText} ${sm.badgeRing}`}>
            {sm.label}
          </span>
        </div>

        {/* Pricing row */}
        <div className="flex items-end gap-6 flex-wrap">
          <div>
            <p className="text-[10px] uppercase tracking-widest font-semibold text-zinc-600 mb-1">Asking Price</p>
            <p className="text-3xl font-black text-white tracking-tight leading-none">
              {price !== null ? `$${price.toLocaleString()}` : "—"}
            </p>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-widest font-semibold text-zinc-600 mb-1">Market Value</p>
            {market_value ? (
              <p className="text-xl font-bold text-zinc-300">${market_value.toLocaleString()}</p>
            ) : (
              <p className="text-sm text-zinc-600 italic leading-none pt-1">Unable to estimate</p>
            )}
          </div>

          {estimated_profit !== null ? (
            <div className={`ml-auto flex items-center gap-2.5 px-4 py-2.5 rounded-xl ${
              profitPositive
                ? "bg-emerald-500/10 ring-1 ring-emerald-500/25"
                : "bg-red-500/10 ring-1 ring-red-500/25"
            }`}>
              {profitPositive
                ? <TrendingUp className="h-4 w-4 text-emerald-400 shrink-0" />
                : <TrendingDown className="h-4 w-4 text-red-400 shrink-0" />}
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-zinc-600 leading-none mb-1">Est. Profit</p>
                <p className={`text-xl font-black leading-none ${profitPositive ? "text-emerald-300" : "text-red-400"}`}>
                  {profitPositive ? "+" : ""}${estimated_profit.toLocaleString()}
                </p>
              </div>
            </div>
          ) : (
            <div className="ml-auto flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-zinc-800/40 ring-1 ring-white/[0.06]">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold text-zinc-600 leading-none mb-1">Est. Profit</p>
                <p className="text-sm text-zinc-600 italic">N/A</p>
              </div>
            </div>
          )}
        </div>

        {/* AI justification */}
        {justification && (
          <p className="text-sm text-zinc-400 leading-relaxed border-l-2 border-zinc-700 pl-3 italic">
            {justification}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-white/[0.05]">
          <a href={url} target="_blank" rel="noopener noreferrer">
            <button className="flex items-center gap-1.5 bg-primary hover:bg-primary/85 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors shadow-sm shadow-primary/20">
              View listing
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </a>

          {status !== "saved" && (
            <button
              onClick={() => onStatusChange(id, "saved")}
              className="flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <Bookmark className="h-3.5 w-3.5" />Save
            </button>
          )}

          {status !== "dismissed" && (
            <button
              onClick={() => onStatusChange(id, "dismissed")}
              className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.06] transition-colors"
            >
              <X className="h-3.5 w-3.5" />Dismiss
            </button>
          )}

          {(status === "saved" || status === "dismissed") && (
            <button
              onClick={() => onStatusChange(id, "new")}
              className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.06] transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function formatRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just listed";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
