"use client";

import { useState, useEffect, useCallback } from "react";
import { ListingCard } from "@/components/dashboard/ListingCard";
import { SearchButton } from "@/components/dashboard/SearchButton";
import { FilterBar, type Filters } from "@/components/dashboard/FilterBar";
import { ChevronLeft, ChevronRight, Flag, Car, MapPin, Download } from "lucide-react";
import type { ListingWithState, ListingStatus, UserSettings } from "@/lib/types";
import type { FlaggedListing } from "@/lib/flaggedStore";
import { exportListingsPdf } from "@/lib/exportPdf";
import { HelpWidget } from "@/components/dashboard/HelpWidget";

const CURRENT_YEAR = new Date().getFullYear();

const SHOW_FLAGGED_TAB = false;

const DEFAULT_FILTERS: Filters = {
  priceMin: 0,
  priceMax: 100000,
  minProfit: 0,
  minScore: 0,
  yearMin: 2000,
  yearMax: CURRENT_YEAR,
  maxMiles: 200000,
  makes: [],
  sortBy: "score_desc",
};

type Tab = "new" | "saved" | "dismissed" | "all" | "flagged";

interface DashboardClientProps {
  initialSettings: UserSettings | null;
}

export function DashboardClient({ initialSettings }: DashboardClientProps) {
  const [currentLocation, setCurrentLocation] = useState(initialSettings?.location ?? "");
  const [currentRadius, setCurrentRadius] = useState(initialSettings?.radius_miles ?? 50);
  const [activeTab, setActiveTab] = useState<Tab>("new");
  const [listings, setListings] = useState<ListingWithState[]>([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [fetching, setFetching] = useState(false);
  const [page, setPage] = useState(1);
  const [flagged, setFlagged] = useState<FlaggedListing[]>([]);
  const [exporting, setExporting] = useState(false);
  const [scanCount, setScanCount] = useState(0);

  const fetchListings = useCallback(async (tab: string, f: Filters, p: number) => {
    setFetching(true);
    const params = new URLSearchParams({
      status: tab, sortBy: f.sortBy, page: String(p),
      priceMin: String(f.priceMin), priceMax: String(f.priceMax),
      minProfit: String(f.minProfit), minScore: String(f.minScore),
      yearMin: String(f.yearMin), yearMax: String(f.yearMax),
      maxMiles: String(f.maxMiles),
    });
    if (f.makes.length > 0) params.set("makes", f.makes.join(","));
    const res = await fetch(`/api/listings?${params}`);
    const data = await res.json();
    setListings(data.listings ?? []);
    setTotal(data.total ?? 0);
    setFetching(false);
  }, []);

  useEffect(() => {
    if (activeTab !== "flagged") fetchListings(activeTab, filters, page);
  }, [activeTab, filters, page, fetchListings]);

  async function handleStatusChange(id: string, status: ListingStatus) {
    await fetch(`/api/listings/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (status !== activeTab && activeTab !== "all") {
      setListings((prev) => prev.filter((l) => l.id !== id));
      setTotal((t) => t - 1);
    } else {
      setListings((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    }
  }

  async function handleExport() {
    setExporting(true);
    const params = new URLSearchParams({
      status: activeTab, sortBy: filters.sortBy, all: "true",
      priceMin: String(filters.priceMin), priceMax: String(filters.priceMax),
      minProfit: String(filters.minProfit), minScore: String(filters.minScore),
      yearMin: String(filters.yearMin), yearMax: String(filters.yearMax),
      maxMiles: String(filters.maxMiles),
    });
    if (filters.makes.length > 0) params.set("makes", filters.makes.join(","));
    const res = await fetch(`/api/listings?${params}`);
    const data = await res.json();
    const sortLabel = filters.sortBy.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    await exportListingsPdf(data.listings ?? [], sortLabel);
    setExporting(false);
  }

  const totalPages = Math.ceil(total / 20);
  const hasLocation = !!currentLocation.trim();

  const tabs: { id: Tab; label: string }[] = [
    { id: "new", label: "New" },
    { id: "saved", label: "Saved" },
    { id: "dismissed", label: "Dismissed" },
    { id: "all", label: "All" },
    ...(SHOW_FLAGGED_TAB ? [{ id: "flagged" as Tab, label: "Flagged" }] : []),
  ];

  return (
    <div className="space-y-5">

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-zinc-900 via-zinc-900 to-violet-950/30 p-6 md:p-8">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/8 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-48 w-48 rounded-full bg-violet-700/6 blur-3xl" />
        </div>

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/25">
                <Car className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-white leading-none">Flip Finder</h1>
                <p className="text-xs text-zinc-500 mt-0.5 font-medium">Facebook Marketplace · Auto Deals</p>
              </div>
            </div>

            <p className="text-sm text-zinc-400 max-w-sm leading-relaxed">
              Scan local listings, score deals by profit potential, and build your flip pipeline.
            </p>

            <div className="flex items-center gap-2 flex-wrap">
              {hasLocation ? (
                <div className="flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1 ring-1 ring-white/[0.08]">
                  <MapPin className="h-3 w-3 text-zinc-400" />
                  <span className="text-xs font-medium text-zinc-300">{currentLocation} · {currentRadius}mi</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 ring-1 ring-amber-500/20">
                  <MapPin className="h-3 w-3 text-amber-400" />
                  <span className="text-xs font-medium text-amber-300">Set location below to scan</span>
                </div>
              )}
              {activeTab !== "flagged" && total > 0 && (
                <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 ring-1 ring-emerald-500/20">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-300">{total} listing{total !== 1 ? "s" : ""}</span>
                </div>
              )}
            </div>
          </div>

          <SearchButton
            disabled={!hasLocation}
            location={currentLocation}
            radius={currentRadius}
            onSearchComplete={(f) => {
              if (f) setFlagged((prev) => [...prev, ...f]);
              fetchListings(activeTab, filters, page);
              setScanCount((c) => c + 1);
            }}
          />
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        filters={filters}
        onChange={(f) => { setFilters(f); setPage(1); }}
        location={currentLocation}
        radius={currentRadius}
        onLocationChange={(loc, rad) => { setCurrentLocation(loc); setCurrentRadius(rad); }}
      />

      {/* Tabs + export */}
      <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-0.5 rounded-xl bg-white/[0.03] p-1 ring-1 ring-white/[0.06] w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setPage(1); }}
            className={`relative px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${
              activeTab === tab.id
                ? "bg-white/[0.1] text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]"
            }`}
          >
            {tab.label}
            {tab.id === "flagged" && flagged.length > 0 && (
              <span className="ml-1.5 text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full font-bold">
                {flagged.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab !== "flagged" && total > 0 && (
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg border border-white/[0.08] text-zinc-400 hover:text-white hover:border-white/15 disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          {exporting ? "Exporting..." : "Download PDF"}
        </button>
      )}
      </div>

      {/* Content */}
      {activeTab === "flagged" ? (
        flagged.length === 0 ? (
          <div className="flex flex-col items-center py-24 gap-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 ring-1 ring-amber-500/20 flex items-center justify-center">
              <Flag className="h-5 w-5 text-amber-400/50" />
            </div>
            <p className="text-zinc-500 text-sm">No flagged listings yet. Run a scan to see what gets filtered out.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {flagged.map((item, i) => (
              <div key={i} className="flex items-center gap-4 rounded-xl border border-amber-500/10 bg-amber-500/[0.04] px-4 py-3.5 hover:border-amber-500/20 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/80 truncate">{item.title ?? "Unknown listing"}</p>
                  <p className="text-xs text-zinc-600 mt-0.5">
                    {item.price ? `$${item.price.toLocaleString()}` : "No price"}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20 capitalize">
                  {item.reason}
                </span>
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-xs text-zinc-600 hover:text-zinc-300 transition-colors">
                  View →
                </a>
              </div>
            ))}
          </div>
        )
      ) : fetching ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-7 h-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-sm text-zinc-500">Loading deals...</span>
        </div>
      ) : listings.length === 0 ? (
        <div className="flex flex-col items-center py-24 gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.08] flex items-center justify-center">
            <Car className="h-6 w-6 text-zinc-600" />
          </div>
          <div>
            <p className="text-zinc-300 font-semibold text-sm">No listings found</p>
            <p className="text-zinc-600 text-sm mt-1">
              {activeTab === "new" ? "Run a scan to find deals in your area." : `No ${activeTab} listings match your filters.`}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} onStatusChange={handleStatusChange} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && activeTab !== "flagged" && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg border border-white/[0.08] text-zinc-400 hover:text-white hover:border-white/15 disabled:opacity-25 disabled:pointer-events-none transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />Prev
          </button>
          <span className="text-sm font-medium text-zinc-500">{page} / {totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg border border-white/[0.08] text-zinc-400 hover:text-white hover:border-white/15 disabled:opacity-25 disabled:pointer-events-none transition-colors"
          >
            Next<ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <HelpWidget currentLocation={currentLocation} scanCount={scanCount} />
    </div>
  );
}
