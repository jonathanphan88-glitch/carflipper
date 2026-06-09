import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { runFacebookMarketplaceScraper, getRunStatus, getRunResults, type ApifyListing } from "@/lib/apify";
import { MOCK_APIFY_RESULTS } from "@/lib/apify.mock";
import { evaluateListing } from "@/lib/valuation";
import { addFlagged } from "@/lib/flaggedStore";
import { computeScore } from "@/lib/scoring";

export async function POST(request: NextRequest) {
  console.log("[search] POST /api/search/run called");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const bodyLocation: string | undefined = body.location;
  const bodyRadius: number | undefined = body.radius_miles;

  const { data: settings } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const location = bodyLocation?.trim() || settings?.location;
  const radius = bodyRadius ?? settings?.radius_miles ?? 50;

  if (!location) {
    return NextResponse.json(
      { error: "Please configure your location before searching." },
      { status: 400 }
    );
  }

  // Persist current location/radius for next session
  await supabase.from("user_settings").upsert(
    { user_id: user.id, location, radius_miles: radius },
    { onConflict: "user_id" }
  );

  const serviceClient = await createServiceClient();

  // Create a search run record
  const { data: searchRun, error: runError } = await serviceClient
    .from("search_runs")
    .insert({
      user_id: user.id,
      status: "running",
    })
    .select()
    .single();

  if (runError || !searchRun) {
    return NextResponse.json({ error: "Failed to create search run" }, { status: 500 });
  }

  // Kick off scrape asynchronously using current location/radius from request
  processSearch(searchRun.id, user.id, { ...settings, location, radius_miles: radius }, serviceClient);

  return NextResponse.json({ runId: searchRun.id, status: "running" });
}

async function processSearch(
  runId: string,
  userId: string,
  settings: {
    location: string;
    radius_miles: number;
    price_min: number;
    price_max: number;
    min_profit: number;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serviceClient: any
) {
  try {
    // Clear previous "new" listings so each scan starts fresh.
    // "saved" and "dismissed" are preserved intentionally.
    await serviceClient
      .from("user_listing_states")
      .delete()
      .eq("user_id", userId)
      .eq("status", "new");

    let rawListings: ApifyListing[];

    console.log("[search] processSearch started, location =", settings.location, "| APIFY_MOCK =", process.env.APIFY_MOCK);

    if (process.env.APIFY_MOCK === "true") {
      // Use hardcoded mock data for UI testing
      const { normalizeForMock } = await import("@/lib/apify");
      rawListings = MOCK_APIFY_RESULTS.map(normalizeForMock);
      console.log("[search] mock listings loaded:", rawListings.length);
    } else {
      const apifyRunId = await runFacebookMarketplaceScraper({
        location: settings.location,
        priceMin: settings.price_min,
        priceMax: settings.price_max,
        radiusMiles: settings.radius_miles,
      });

      // Poll for completion (max 5 minutes)
      let datasetId: string | null = null;
      for (let i = 0; i < 60; i++) {
        await sleep(5000);
        const { status, datasetId: dsId } = await getRunStatus(apifyRunId);
        if (status === "SUCCEEDED") {
          datasetId = dsId;
          break;
        }
        if (status === "FAILED" || status === "ABORTED") {
          throw new Error(`Apify run ${status}`);
        }
      }

      if (!datasetId) throw new Error("Apify run timed out");
      rawListings = await getRunResults(datasetId);
    }

    let listingsFound = 0;
    let listingsNew = 0;
    let skippedTooOld = 0, skippedSalvage = 0, skippedLlm = 0, skippedNoPrice = 0;

    console.log("[search] processing", rawListings.length, "listings");

    for (const raw of rawListings) {
      if (!raw.description) console.log("[search] no description:", raw.title);
      if (!raw.year) console.log("[search] no year:", raw.title);

      if (raw.year && raw.year < 2000) {
        console.log("[search] skip (too old):", raw.title, "year:", raw.year);
        addFlagged(runId, { title: raw.title, price: raw.price, url: raw.url, reason: "too old" });
        skippedTooOld++;
        continue;
      }

      const conditionText = [raw.title, raw.description].filter(Boolean).join(" ");
      const conditionLower = conditionText.toLowerCase();

      const SALVAGE_PHRASES = ["salvage", "rebuilt title", "junk title", "branded title", "flood title"];
      const matchedSalvage = SALVAGE_PHRASES.find((kw) => conditionLower.includes(kw));
      if (matchedSalvage) {
        console.log(`[search] skip (salvage - "${matchedSalvage}"):`, raw.title);
        addFlagged(runId, { title: raw.title, price: raw.price, url: raw.url, reason: "salvage title" });
        skippedSalvage++;
        continue;
      }

      const evaluation = await evaluateListing({
        title: raw.title,
        year: raw.year,
        make: raw.make,
        model: raw.model,
        mileage: raw.mileage,
        price: raw.price,
        description: raw.description,
      });

      if (evaluation.skip) {
        console.log(`[search] skip (${evaluation.reason}):`, raw.title);
        addFlagged(runId, { title: raw.title, price: raw.price, url: raw.url, reason: evaluation.reason });
        skippedLlm++;
        continue;
      }

      if (!raw.price) {
        console.log("[search] skip (no price):", raw.title, "| raw price field:", raw.price);
        addFlagged(runId, { title: raw.title, price: null, url: raw.url, reason: "no price" });
        skippedNoPrice++;
        continue;
      }

      const marketValue = evaluation.marketValue;
      const estimatedProfit = marketValue ? marketValue - raw.price : null;

      const score = computeScore({
        price: raw.price,
        marketValue,
        mileage: raw.mileage,
        year: raw.year,
        conditionText: conditionText || null,
      });

      // Upsert listing (deduplicate by apify_id)
      const { data: listing, error: listingError } = await serviceClient
        .from("listings")
        .upsert(
          {
            apify_id: raw.id,
            url: raw.url,
            title: raw.title,
            price: raw.price,
            year: raw.year,
            make: raw.make,
            model: raw.model,
            mileage: raw.mileage,
            condition_text: conditionText.slice(0, 2000),
            location: raw.location,
            images: raw.images.slice(0, 10),
            listed_at: raw.listedAt,
            fetched_at: new Date().toISOString(),
            market_value: marketValue,
            estimated_profit: estimatedProfit,
            score,
            raw_json: { ...raw, _llm_justification: evaluation.justification },
          },
          { onConflict: "apify_id" }
        )
        .select()
        .single();

      if (listingError || !listing) {
        console.log("[search] upsert failed:", listingError?.message, "title:", raw.title);
        continue;
      }
      listingsFound++;

      // Create user_listing_state if it doesn't exist (new listing for this user)
      const { error: stateError } = await serviceClient
        .from("user_listing_states")
        .insert({ user_id: userId, listing_id: listing.id, status: "new" })
        .select()
        .single();

      // 23505 = unique_violation: state already exists, not an error we care about
      if (!stateError) {
        listingsNew++;
      } else if (stateError.code !== "23505") {
        console.log("[search] state insert failed:", stateError.message, "listing:", listing.id);
      }
    }

    await serviceClient
      .from("search_runs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        listings_found: listingsFound,
        listings_new: listingsNew,
      })
      .eq("id", runId);

    console.log(`[search] done. location=${settings.location} found: ${listingsFound} new: ${listingsNew} | skipped: tooOld=${skippedTooOld} salvage=${skippedSalvage} llm=${skippedLlm} noPrice=${skippedNoPrice}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[search] processSearch error:", message);
    await serviceClient
      .from("search_runs")
      .update({ status: "failed", error_message: message })
      .eq("id", runId);
  }
}


function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
