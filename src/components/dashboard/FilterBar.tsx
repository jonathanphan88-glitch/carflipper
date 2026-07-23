"use client";

import { useState, useEffect, useRef } from "react";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, ChevronDown } from "lucide-react";
import type { SortField } from "@/lib/types";

const ALL_MAKES = [
  "Acura", "Alfa Romeo", "Aston Martin", "Audi", "Bentley", "BMW", "Buick",
  "Cadillac", "Chevrolet", "Chrysler", "Daewoo", "Dodge", "Ferrari", "Fiat",
  "Ford", "Genesis", "GMC", "Honda", "Hummer", "Hyundai", "Infiniti", "Isuzu",
  "Jaguar", "Jeep", "Kia", "Lamborghini", "Land Rover", "Lexus", "Lincoln",
  "Maserati", "Maybach", "Mazda", "McLaren", "Mercedes-Benz", "Mercury", "Mini",
  "Mitsubishi", "Nissan", "Oldsmobile", "Pontiac", "Porsche", "Ram",
  "Rolls-Royce", "Saab", "Saturn", "Scion", "Smart", "Subaru", "Suzuki",
  "Tesla", "Toyota", "Volkswagen", "Volvo",
];

const SORT_LABELS: Record<SortField, string> = {
  score_desc: "Score: High → Low",
  score_asc: "Score: Low → High",
  estimated_profit_desc: "Profit: High → Low",
  estimated_profit_asc: "Profit: Low → High",
  price_asc: "Price: Low → High",
  price_desc: "Price: High → Low",
  mileage_asc: "Miles: Low → High",
  mileage_desc: "Miles: High → Low",
};

export interface Filters {
  priceMin: number;
  priceMax: number;
  minProfit: number;
  minScore: number;
  yearMin: number;
  yearMax: number;
  maxMiles: number;
  makes: string[];
  sortBy: SortField;
}

interface FilterBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  location: string;
  radius: number;
  onLocationChange: (location: string, radius: number) => void;
}

export function FilterBar({ filters, onChange, location, radius, onLocationChange }: FilterBarProps) {
  const [localLocation, setLocalLocation] = useState(location);
  const [localRadius, setLocalRadius] = useState(radius);
  const [makeOpen, setMakeOpen] = useState(false);
  const makeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (makeRef.current && !makeRef.current.contains(e.target as Node)) {
        setMakeOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function update(patch: Partial<Filters>) {
    onChange({ ...filters, ...patch });
  }

  function toggleMake(make: string) {
    const next = filters.makes.includes(make)
      ? filters.makes.filter((m) => m !== make)
      : [...filters.makes, make];
    update({ makes: next });
  }

  const makeLabel = filters.makes.length === 0
    ? "All Makes"
    : filters.makes.length === 1
    ? filters.makes[0]
    : `${filters.makes[0]} +${filters.makes.length - 1}`;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[oklch(0.16_0.007_265)] p-4 space-y-4">

      {/* Scan settings row */}
      <div className="flex flex-wrap items-end gap-4 pb-4 border-b border-white/[0.06]">

        <div className="space-y-1.5 w-56">
          <span className="text-sm font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />Location
          </span>
          <input
            type="text"
            value={localLocation}
            onChange={(e) => { setLocalLocation(e.target.value); onLocationChange(e.target.value, localRadius); }}
            placeholder="e.g. San Jose, CA or 90007"
            className="w-full h-9 bg-white/[0.05] border border-white/10 rounded-lg px-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
          />
        </div>

        <div className="space-y-2.5 w-44">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Radius</span>
            <span className="text-sm font-mono font-medium text-zinc-300">{localRadius} mi</span>
          </div>
          <Slider
            min={10} max={200} step={10}
            value={[localRadius]}
            onValueChange={(v) => {
              const arr = Array.isArray(v) ? v : [v];
              if (arr[0] !== undefined) { setLocalRadius(arr[0]); onLocationChange(localLocation, arr[0]); }
            }}
          />
        </div>

      </div>

      {/* Display filters row */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-6">

        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Price</span>
            <span className="text-sm font-mono font-medium text-zinc-300">
              ${filters.priceMin.toLocaleString()} – ${filters.priceMax.toLocaleString()}
            </span>
          </div>
          <Slider
            min={0} max={100000} step={500}
            value={[filters.priceMin, filters.priceMax]}
            onValueChange={(v) => {
              const arr = Array.isArray(v) ? v : [v];
              update({ priceMin: arr[0] ?? filters.priceMin, priceMax: arr[1] ?? filters.priceMax });
            }}
          />
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Min Profit</span>
            <span className="text-sm font-mono font-medium text-zinc-300">${filters.minProfit.toLocaleString()}</span>
          </div>
          <Slider
            min={0} max={10000} step={250}
            value={[filters.minProfit]}
            onValueChange={(v) => {
              const n = Array.isArray(v) ? v[0] : v;
              update({ minProfit: n ?? filters.minProfit });
            }}
          />
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Min Score</span>
            <span className="text-sm font-mono font-medium text-zinc-300">{filters.minScore}</span>
          </div>
          <Slider
            min={0} max={100} step={5}
            value={[filters.minScore]}
            onValueChange={(v) => {
              const n = Array.isArray(v) ? v[0] : v;
              update({ minScore: n ?? filters.minScore });
            }}
          />
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Year</span>
            <span className="text-sm font-mono font-medium text-zinc-300">{filters.yearMin} – {filters.yearMax}</span>
          </div>
          <Slider
            min={2000} max={new Date().getFullYear()} step={1}
            value={[filters.yearMin, filters.yearMax]}
            onValueChange={(v) => {
              const arr = Array.isArray(v) ? v : [v];
              update({ yearMin: arr[0] ?? filters.yearMin, yearMax: arr[1] ?? filters.yearMax });
            }}
          />
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Max Miles</span>
            <span className="text-sm font-mono font-medium text-zinc-300">
              {filters.maxMiles >= 200000 ? "Any" : `${(filters.maxMiles / 1000).toFixed(0)}k`}
            </span>
          </div>
          <Slider
            min={10000} max={200000} step={5000}
            value={[filters.maxMiles]}
            onValueChange={(v) => {
              const n = Array.isArray(v) ? v[0] : v;
              update({ maxMiles: n ?? filters.maxMiles });
            }}
          />
        </div>

        <div className="space-y-2.5">
          <span className="text-sm font-semibold uppercase tracking-wider text-zinc-500 block">Sort by</span>
          <Select value={filters.sortBy} onValueChange={(v) => update({ sortBy: v as SortField })}>
            <SelectTrigger className="h-9 text-sm bg-white/[0.04] border-white/8 text-zinc-300 hover:bg-white/[0.07] transition-colors rounded-lg">
              <span>{SORT_LABELS[filters.sortBy]}</span>
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-white/10 rounded-xl">
              <SelectItem value="score_desc" className="text-sm text-zinc-300">Score: High → Low</SelectItem>
              <SelectItem value="score_asc" className="text-sm text-zinc-300">Score: Low → High</SelectItem>
              <SelectItem value="estimated_profit_desc" className="text-sm text-zinc-300">Profit: High → Low</SelectItem>
              <SelectItem value="estimated_profit_asc" className="text-sm text-zinc-300">Profit: Low → High</SelectItem>
              <SelectItem value="price_asc" className="text-sm text-zinc-300">Price: Low → High</SelectItem>
              <SelectItem value="price_desc" className="text-sm text-zinc-300">Price: High → Low</SelectItem>
              <SelectItem value="mileage_asc" className="text-sm text-zinc-300">Miles: Low → High</SelectItem>
              <SelectItem value="mileage_desc" className="text-sm text-zinc-300">Miles: High → Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

      </div>

      {/* Make filter */}
      <div className="flex items-center gap-3 pt-3 border-t border-white/[0.06]">
        <span className="text-sm font-semibold uppercase tracking-wider text-zinc-500 shrink-0">Make</span>
        <div className="relative" ref={makeRef}>
          <button
            onClick={() => setMakeOpen((o) => !o)}
            className="flex items-center gap-1.5 h-9 px-3 bg-white/[0.04] border border-white/8 rounded-lg text-sm text-zinc-300 hover:bg-white/[0.07] transition-colors"
          >
            <span>{makeLabel}</span>
            <ChevronDown className={`h-3 w-3 text-zinc-500 transition-transform ${makeOpen ? "rotate-180" : ""}`} />
          </button>
          {makeOpen && (
            <div className="absolute top-full left-0 mt-1 z-50 w-48 max-h-64 overflow-y-auto bg-zinc-900 border border-white/10 rounded-xl py-1 shadow-2xl shadow-black/60">
              {ALL_MAKES.map((make) => {
                const active = filters.makes.includes(make);
                return (
                  <button
                    key={make}
                    onClick={() => toggleMake(make)}
                    className="flex items-center gap-2.5 w-full px-3 py-1.5 text-sm text-left hover:bg-white/5 transition-colors"
                  >
                    <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${active ? "bg-primary border-primary" : "border-zinc-600"}`}>
                      {active && <span className="text-white text-[9px] font-black">✓</span>}
                    </span>
                    <span className={active ? "text-white" : "text-zinc-400"}>{make}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        {filters.makes.length > 0 && (
          <button
            onClick={() => update({ makes: [] })}
            className="text-sm text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
