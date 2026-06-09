export type ListingStatus = "new" | "saved" | "dismissed";

export interface Listing {
  id: string;
  apify_id: string;
  url: string;
  title: string | null;
  price: number | null;
  year: number | null;
  make: string | null;
  model: string | null;
  mileage: number | null;
  condition_text: string | null;
  location: string | null;
  images: string[];
  listed_at: string | null;
  fetched_at: string;
  market_value: number | null;
  estimated_profit: number | null;
  score: number | null;
  raw_json: Record<string, unknown> | null;
  created_at: string;
}

export interface ListingWithState extends Listing {
  status: ListingStatus;
}

export interface UserSettings {
  id: string;
  user_id: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  radius_miles: number;
  price_min: number;
  price_max: number;
  min_profit: number;
  min_score: number;
  email_alerts_enabled: boolean;
}

export interface SearchRun {
  id: string;
  user_id: string;
  triggered_at: string;
  completed_at: string | null;
  status: "running" | "completed" | "failed";
  listings_found: number;
  listings_new: number;
  error_message: string | null;
}

export type SortField =
  | "score_desc" | "score_asc"
  | "price_desc" | "price_asc"
  | "estimated_profit_desc" | "estimated_profit_asc"
  | "mileage_asc" | "mileage_desc";
