import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = request.nextUrl.searchParams;
  const status = params.get("status") ?? "new";
  const sortParam = params.get("sortBy") ?? "score_desc";
  const lastUnderscore = sortParam.lastIndexOf("_");
  const sortField = sortParam.slice(0, lastUnderscore);
  const sortDir = sortParam.slice(lastUnderscore + 1) === "asc";
  const fetchAll = params.get("all") === "true";
  const page = parseInt(params.get("page") ?? "1");
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  // Get listing IDs for this user with requested status
  let stateQuery = supabase
    .from("user_listing_states")
    .select("listing_id")
    .eq("user_id", user.id);

  if (status !== "all") {
    stateQuery = stateQuery.eq("status", status);
  }

  const { data: states } = await stateQuery;
  if (!states?.length) return NextResponse.json({ listings: [], total: 0 });

  const listingIds = states.map((s) => s.listing_id);

  // Fetch listings with filters
  const priceMin = params.get("priceMin");
  const priceMax = params.get("priceMax");
  const minProfit = params.get("minProfit");
  const minScore = params.get("minScore");
  const yearMin = params.get("yearMin");
  const yearMax = params.get("yearMax");
  const maxMiles = params.get("maxMiles");
  const makesParam = params.get("makes");

  let query = supabase
    .from("listings")
    .select("*", { count: "exact" })
    .in("id", listingIds);

  if (priceMin && parseInt(priceMin) > 0) query = query.gte("price", parseInt(priceMin));
  if (priceMax && parseInt(priceMax) > 0) query = query.lte("price", parseInt(priceMax));
  if (minProfit && parseInt(minProfit) > 0) query = query.gte("estimated_profit", parseInt(minProfit));
  if (minScore && parseInt(minScore) > 0) query = query.gte("score", parseInt(minScore));
  const yearMinInt = yearMin ? parseInt(yearMin) : null;
  const yearMaxInt = yearMax ? parseInt(yearMax) : null;
  const currentYear = new Date().getFullYear();
  if (yearMinInt && yearMinInt > 2000) query = query.gte("year", yearMinInt).not("year", "is", null);
  if (yearMaxInt && yearMaxInt < currentYear) query = query.lte("year", yearMaxInt).not("year", "is", null);
  const maxMilesInt = maxMiles ? parseInt(maxMiles) : null;
  if (maxMilesInt && maxMilesInt < 200000) query = query.lte("mileage", maxMilesInt).not("mileage", "is", null);
  const makesFilter = makesParam ? makesParam.split(",").filter(Boolean) : [];
  if (makesFilter.length > 0) query = query.in("make", makesFilter);

  const validSortFields = ["score", "price", "estimated_profit", "mileage"];
  const safeSortField = validSortFields.includes(sortField) ? sortField : "score";

  query = query.order(safeSortField, { ascending: sortDir, nullsFirst: false });
  if (!fetchAll) query = query.range(offset, offset + pageSize - 1);

  const { data: listings, count } = await query;

  // Attach status to each listing
  const stateMap = new Map(
    states.map((s) => [s.listing_id, status === "all" ? undefined : status])
  );

  if (status === "all") {
    const { data: allStates } = await supabase
      .from("user_listing_states")
      .select("listing_id, status")
      .eq("user_id", user.id)
      .in("listing_id", listingIds);
    allStates?.forEach((s) => stateMap.set(s.listing_id, s.status));
  }

  const listingsWithState = listings?.map((l) => ({
    ...l,
    status: stateMap.get(l.id) ?? "new",
  }));

  return NextResponse.json({ listings: listingsWithState ?? [], total: count ?? 0 });
}
