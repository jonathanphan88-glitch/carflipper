const APIFY_BASE = "https://api.apify.com/v2";

export interface ApifyListing {
  id: string;
  url: string;
  title: string | null;
  price: number | null;
  year: number | null;
  make: string | null;
  model: string | null;
  mileage: number | null;
  description: string | null;
  location: string | null;
  images: string[];
  listedAt: string | null;
}

interface ApifyRunResponse {
  data: { id: string; status: string; defaultDatasetId: string };
}

// Resolve a zip code to city + state using OpenStreetMap Nominatim
async function resolveZipToCity(zip: string): Promise<{ city: string; state: string }> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?postalcode=${zip}&country=US&format=json&limit=1&addressdetails=1`,
    { headers: { "User-Agent": "car-flip-finder/1.0" } }
  );
  if (!res.ok) return { city: zip, state: "" };
  const data = await res.json() as Array<{ address?: { city?: string; town?: string; village?: string; county?: string; state?: string } }>;
  if (!data.length) return { city: zip, state: "" };
  const addr = data[0].address;
  const city = addr?.city ?? addr?.town ?? addr?.village ?? addr?.county ?? "";
  const state = addr?.state ?? "";
  return { city, state };
}

// Facebook Marketplace city slugs — many cities don't have dedicated FB pages,
// so we map them to the nearest metro that does.
const CITY_SLUG_OVERRIDES: Record<string, string> = {
  // California — Los Angeles metro
  "los angeles": "la",
  "santa monica": "la",
  "long beach": "la",
  "pasadena": "la",
  "burbank": "la",
  "glendale": "la",
  "torrance": "la",
  "inglewood": "la",
  "compton": "la",
  "hawthorne": "la",
  "el monte": "la",
  "pomona": "la",
  "west covina": "la",
  "norwalk": "la",
  "downey": "la",
  "costa mesa": "orangecounty",
  "santa ana": "108337745853447",
  "anaheim": "orangecounty",
  "irvine": "orangecounty",
  "huntington beach": "orangecounty",
  "garden grove": "orangecounty",
  "fullerton": "orangecounty",
  "orange": "orangecounty",
  "mission viejo": "orangecounty",
  "newport beach": "orangecounty",
  // California — Bay Area
  "san francisco": "sanfrancisco",
  "sf": "sanfrancisco",
  "oakland": "sfbayarea",
  "berkeley": "sfbayarea",
  "fremont": "sfbayarea",
  "hayward": "sfbayarea",
  "san jose": "sanjose",
  "sunnyvale": "sanjose",
  "santa clara": "sanjose",
  "mountain view": "sanjose",
  "palo alto": "sanjose",
  // California — other
  "san diego": "sandiego",
  "sacramento": "sacramento",
  "fresno": "fresno",
  "stockton": "stockton",
  "bakersfield": "bakersfield",
  "riverside": "inlandempire",
  "san bernardino": "inlandempire",
  "ontario": "inlandempire",
  "rancho cucamonga": "inlandempire",
  // New York
  "new york": "nyc",
  "new york city": "nyc",
  "brooklyn": "nyc",
  "queens": "nyc",
  "bronx": "nyc",
  "staten island": "nyc",
  "jersey city": "nyc",
  "newark": "nyc",
  // Texas
  "dallas": "dallas",
  "fort worth": "dallas",
  "arlington": "dallas",
  "houston": "houston",
  "austin": "austin",
  "san antonio": "sanantonio",
  // Florida
  "miami": "miami",
  "hialeah": "miami",
  "fort lauderdale": "miami",
  "orlando": "orlando",
  "tampa": "tampa",
  "jacksonville": "jacksonville",
  // Illinois
  "chicago": "chicago",
  // Arizona
  "phoenix": "phoenix",
  "scottsdale": "phoenix",
  "tempe": "phoenix",
  "mesa": "phoenix",
  "chandler": "phoenix",
  "tucson": "tucson",
  // Nevada
  "las vegas": "vegas",
  "henderson": "vegas",
  "north las vegas": "vegas",
  // Washington
  "seattle": "seattle",
  "bellevue": "seattle",
  "tacoma": "seattle",
  // Georgia
  "atlanta": "atlanta",
  // Colorado
  "denver": "denver",
  "aurora": "denver",
  "colorado springs": "coloradosprings",
  // Massachusetts
  "boston": "boston",
  // Michigan
  "detroit": "detroit",
  // Pennsylvania
  "philadelphia": "philadelphia",
  // Ohio
  "columbus": "columbus",
  "cleveland": "cleveland",
  // North Carolina
  "charlotte": "charlotte",
  "raleigh": "raleigh",
};

// When a city has no known FB slug, fall back to that state's main metro
const STATE_SLUG_FALLBACKS: Record<string, string> = {
  "california": "la",
  "new york": "nyc",
  "texas": "dallas",
  "florida": "miami",
  "illinois": "chicago",
  "arizona": "phoenix",
  "nevada": "vegas",
  "washington": "seattle",
  "georgia": "atlanta",
  "colorado": "denver",
  "massachusetts": "boston",
  "michigan": "detroit",
  "pennsylvania": "philadelphia",
  "ohio": "columbus",
  "north carolina": "charlotte",
  "virginia": "washington",
  "maryland": "washington",
  "new jersey": "nyc",
  "connecticut": "nyc",
  "oregon": "portland",
  "minnesota": "minneapolis",
  "missouri": "stlouis",
  "tennessee": "nashville",
  "indiana": "indianapolis",
  "wisconsin": "milwaukee",
};

function toFacebookCitySlug(city: string, state: string): string {
  const cityLower = city.toLowerCase().trim();
  const stateLower = state.toLowerCase().trim();

  // Direct city override
  if (CITY_SLUG_OVERRIDES[cityLower]) return CITY_SLUG_OVERRIDES[cityLower];

  // State fallback for unrecognized cities
  if (STATE_SLUG_FALLBACKS[stateLower]) return STATE_SLUG_FALLBACKS[stateLower];

  // Last resort: slugify the city name
  return cityLower.replace(/\s+/g, "");
}

// Build a Facebook Marketplace vehicles URL with price filters
async function buildMarketplaceUrl(location: string, priceMin: number, priceMax: number): Promise<string> {
  let city: string;
  let state: string;

  if (/^\d{5}$/.test(location.trim())) {
    ({ city, state } = await resolveZipToCity(location.trim()));
  } else {
    const parts = location.split(",");
    city = parts[0]?.trim() ?? location;
    state = parts[1]?.trim() ?? "";
  }

  const slug = toFacebookCitySlug(city, state);
  console.log(`[apify] location "${location}" → city="${city}" state="${state}" → slug "${slug}"`);
  const params = new URLSearchParams({
    minPrice: String(priceMin),
    maxPrice: String(priceMax),
  });
  return `https://www.facebook.com/marketplace/${slug}/vehicles/?${params}`;
}

export async function runFacebookMarketplaceScraper(params: {
  location: string;
  priceMin: number;
  priceMax: number;
  radiusMiles: number;
}): Promise<string> {
  const token = process.env.APIFY_API_TOKEN!;
  const actorId = process.env.APIFY_ACTOR_ID!.replace("/", "~");

  const url = await buildMarketplaceUrl(params.location, params.priceMin, params.priceMax);

  const res = await fetch(
    `${APIFY_BASE}/acts/${actorId}/runs?token=${token}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startUrls: [{ url }],
        resultsLimit: 100,
        includeListingDetails: true,
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Apify run failed: ${res.status} ${await res.text()}`);
  }

  const data: ApifyRunResponse = await res.json();
  return data.data.id;
}

export async function getRunStatus(
  runId: string
): Promise<{ status: string; datasetId: string }> {
  const token = process.env.APIFY_API_TOKEN!;
  const res = await fetch(`${APIFY_BASE}/actor-runs/${runId}?token=${token}`);
  if (!res.ok) throw new Error(`Failed to get run status: ${res.status}`);
  const data: ApifyRunResponse = await res.json();
  return {
    status: data.data.status,
    datasetId: data.data.defaultDatasetId,
  };
}

export async function getRunResults(datasetId: string): Promise<ApifyListing[]> {
  const token = process.env.APIFY_API_TOKEN!;
  const res = await fetch(
    `${APIFY_BASE}/datasets/${datasetId}/items?token=${token}&format=json&clean=true`
  );
  if (!res.ok) throw new Error(`Failed to get dataset: ${res.status}`);
  const items: Record<string, unknown>[] = await res.json();
  return items
    .filter((item) => {
      const sold = item.is_sold ?? item.isSold;
      return !sold;
    })
    .map(normalizeApifyItem);
}

export function normalizeForMock(item: Record<string, unknown>): ApifyListing {
  return normalizeApifyItem(item);
}

function normalizeApifyItem(item: Record<string, unknown>): ApifyListing {
  // Price — camelCase (includeListingDetails:true) or snake_case (false)
  const listingPriceNew = item["listingPrice"] as Record<string, unknown> | null;
  const listingPriceOld = item["listing_price"] as Record<string, unknown> | null;
  const rawAmount =
    (listingPriceNew?.amount as string | null) ??
    (listingPriceNew?.currency_amount as string | null) ??
    (item["listing_price.formatted_amount"] as string | null) ??
    (listingPriceOld?.formatted_amount as string | null) ??
    null;
  const price = rawAmount ? parsePrice(rawAmount) : null;

  // Image
  const primaryPhotoNew = item["primaryListingPhoto"] as Record<string, unknown> | null;
  const primaryPhotoOld = item["primary_listing_photo"] as Record<string, unknown> | null;
  const listingPhotos = item["listingPhotos"] as Array<Record<string, unknown>> | null;
  const imageUri =
    (primaryPhotoNew?.photo_image_url as string | null) ??
    (primaryPhotoOld?.photo_image_url as string | null) ??
    (item["primary_listing_photo.photo_image_url"] as string | null) ??
    ((listingPhotos?.[0]?.image as Record<string, unknown> | null)?.uri as string | null) ??
    null;

  // Title
  const title =
    (item["listingTitle"] as string | null) ??
    (item["marketplace_listing_title"] as string | null) ??
    (item["customTitle"] as string | null) ??
    (item["custom_title"] as string | null) ??
    null;

  // Description — new format returns { text: "..." }, old format is a string
  const rawDesc = item["description"];
  const description: string | null =
    (typeof rawDesc === "string" ? rawDesc : null) ??
    ((rawDesc && typeof rawDesc === "object" && "text" in rawDesc) ? (rawDesc as Record<string, unknown>).text as string : null) ??
    (item["listing_description"] as string | null) ??
    (item["body_text"] as string | null) ??
    (item["post_text"] as string | null) ??
    null;

  // Location
  const locationObj = item["location"] as Record<string, unknown> | null;
  const reverseGeocode = locationObj?.reverse_geocode as Record<string, unknown> | null;
  const locationTextNew = (item["locationText"] as Record<string, unknown> | null)?.text as string | null;
  const locationData = reverseGeocode
    ? `${reverseGeocode.city ?? ""}, ${reverseGeocode.state ?? ""}`.trim().replace(/^,|,$/, "").trim()
    : locationTextNew ?? (item["location_text"] as string | null) ?? null;

  // ID
  const listingUrl =
    (item["itemUrl"] as string | null) ??
    (item["listingUrl"] as string | null) ??
    "";
  const id =
    (item.id as string | null) ??
    listingUrl.match(/\/item\/(\d+)/)?.[1] ??
    String(Math.random());

  // Subtitles (mileage lives here)
  const subtitlesNew = item["customSubTitlesWithRenderingFlags"] as Array<{ subtitle?: string }> | null;
  const subtitlesOld = item["custom_sub_titles_with_rendering_flags"] as Array<{ subtitle?: string }> | null;
  const subtitles = subtitlesNew ?? subtitlesOld;
  const subtitleText = subtitles?.[0]?.subtitle ?? "";

  const allText = [subtitleText, title, description].filter(Boolean).join(" ");
  const year =
    (typeof item.vehicle_year === "number" ? item.vehicle_year as number : null) ??
    (typeof item.year === "number" ? item.year as number : null) ??
    (allText ? parseYear(allText) : null);
  const { make, model } = title ? parseMakeModel(title, year) : { make: null, model: null };
  const mileage = allText ? parseMileage(allText) : null;

  return {
    id,
    url: listingUrl,
    title,
    price,
    year,
    make,
    model,
    mileage,
    description,
    location: locationData,
    images: imageUri ? [imageUri] : [],
    listedAt: null,
  };
}

function parsePrice(val: string): number | null {
  const n = Math.round(parseFloat(val.replace(/[^0-9.]/g, "")));
  if (isNaN(n) || n <= 0) return null;
  if (n === 123456 || n === 1234567) return null;
  return n;
}

function parseYear(text: string): number | null {
  const currentYear = new Date().getFullYear();
  const matches = text.match(/\b((?:19|20)\d{2})\b/g);
  if (!matches) return null;
  for (const m of matches) {
    const n = parseInt(m, 10);
    if (n >= 1900 && n <= currentYear + 1) return n;
  }
  return null;
}

function parseMakeModel(
  title: string,
  year: number | null
): { make: string | null; model: string | null } {
  // Strip "·" separator and everything after (e.g. "CR-V · 2013" → "CR-V")
  let text = title.split("·")[0].trim();

  if (year) text = text.replace(String(year), "").trim();

  // Remove mileage patterns
  text = text.replace(/\d+[,\d]*\s*(mi|miles|k\s*miles?|km)/gi, "").trim();

  // Filter out stray 4-digit year numbers left after replacement
  const words = text.split(/\s+/).filter((w) => w && !/^(19|20)\d{2}$/.test(w));
  const make = words[0] ?? null;
  const model = words.slice(1, 3).join(" ") || null;

  return { make, model };
}

function parseMileage(text: string): number | null {
  // Match patterns like "120k miles", "85,000 miles", "85000 mi"
  const kMatch = text.match(/(\d+)\s*k\s*(?:miles?|mi)/i);
  if (kMatch) return parseInt(kMatch[1], 10) * 1000;

  const fullMatch = text.match(/([\d,]+)\s*(?:miles?|mi)\b/i);
  if (fullMatch) return parseInt(fullMatch[1].replace(/,/g, ""), 10);

  return null;
}
