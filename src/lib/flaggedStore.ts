export interface FlaggedListing {
  title: string | null;
  price: number | null;
  url: string;
  reason: string;
}

// In-memory store keyed by search run ID. Lives until server restart — fine for testing.
const store = new Map<string, FlaggedListing[]>();

export function addFlagged(runId: string, listing: FlaggedListing) {
  if (!store.has(runId)) store.set(runId, []);
  store.get(runId)!.push(listing);
}

export function getFlagged(runId: string): FlaggedListing[] {
  return store.get(runId) ?? [];
}

export function clearFlagged(runId: string) {
  store.delete(runId);
}
