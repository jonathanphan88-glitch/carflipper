const AUTO_DEV_BASE = "https://api.auto.dev";

export function buildCacheKey(
  year: number,
  make: string,
  model: string,
  mileage: number | null,
): string {
  // Bucket mileage to nearest 25k so nearby listings share a cache entry
  const bucket = mileage ? Math.round(mileage / 25000) * 25000 : "unknown";
  return `${year}_${make.toLowerCase()}_${model.split(" ")[0].toLowerCase()}_${bucket}`;
}

export async function fetchMarketValue(
  year: number,
  make: string,
  model: string,
  mileage: number | null,
): Promise<number | null> {
  const apiKey = process.env.AUTO_DEV_API_KEY;
  if (!apiKey) return null;

  try {
    const params = new URLSearchParams({
      "vehicle.year": String(year),
      "vehicle.make": make,
      "vehicle.model": model.split(" ")[0], // base model only, e.g. "Camry" not "Camry LE"
      limit: "20",
    });

    const res = await fetch(`${AUTO_DEV_BASE}/listings?${params}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      console.log("[autodev] fetch failed:", res.status, await res.text().catch(() => ""));
      return null;
    }

    const data = await res.json();
    const records: Record<string, unknown>[] = data.records ?? data.listings ?? data.data ?? (Array.isArray(data) ? data : []);

    if (!records.length) return null;

    // Extract price + miles from each listing
    const comparables = records.map((r) => {
      const listing = r.retailListing as Record<string, unknown> | null;
      const price = (listing?.price ?? r.price ?? null) as number | null;
      const miles = (listing?.miles ?? r.miles ?? null) as number | null;
      return { price, miles };
    });

    // If we know the listing's mileage, prefer comparables within ±40k miles
    let filtered = comparables;
    if (mileage) {
      const lo = mileage - 40000;
      const hi = mileage + 40000;
      const nearby = comparables.filter(
        (c) => c.miles !== null && c.miles >= lo && c.miles <= hi
      );
      // Only use the mileage filter if we have enough results; otherwise fall back to all
      if (nearby.length >= 3) filtered = nearby;
    }

    const prices = filtered
      .map((c) => c.price)
      .filter((p): p is number => typeof p === "number" && p > 500)
      .sort((a, b) => a - b);

    if (!prices.length) return null;

    // Median price of comparable listings = market value
    const mid = Math.floor(prices.length / 2);
    return prices.length % 2 === 0
      ? Math.round((prices[mid - 1] + prices[mid]) / 2)
      : prices[mid];
  } catch {
    return null;
  }
}
