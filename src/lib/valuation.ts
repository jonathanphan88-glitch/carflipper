import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export interface EvaluationResult {
  skip: true;
  reason: string;
}

export interface ValuationResult {
  skip: false;
  marketValue: number | null;
  justification: string | null;
}

export type ListingEvaluation = EvaluationResult | ValuationResult;

export async function evaluateListing(params: {
  title: string | null;
  year: number | null;
  make: string | null;
  model: string | null;
  mileage: number | null;
  price: number | null;
  description: string | null;
}): Promise<ListingEvaluation> {
  const { title, year, make, model, mileage, price, description } = params;

  // Check for spam price in code so we don't need to show the price to the LLM (avoids anchoring)
  if (price !== null && price < 200) {
    return { skip: true, reason: "spam" };
  }

  try {
    const mileageStr = mileage ? `${mileage.toLocaleString()} miles` : "unknown mileage";
    const desc = description?.slice(0, 2000) ?? "(no description)";
    if (!description) console.log("[valuation] no description for:", title);

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      tools: [
        {
          name: "evaluate_listing",
          description: "Evaluate a Facebook Marketplace vehicle listing",
          input_schema: {
            type: "object" as const,
            properties: {
              is_passenger_car: {
                type: "boolean",
                description: "True if this is any standard road vehicle: passenger cars, sedans, coupes, SUVs, crossovers, minivans, vans, pickup trucks, or hatchbacks. False ONLY for motorcycles, boats, RVs, ATVs, scooters, golf carts, jet skis, snowmobiles, trailers, or other non-road/specialty vehicles.",
              },
              skip_reason: {
                type: "string",
                description: `Set a reason to skip for any of the following — otherwise leave empty string:
(1) NOT A PASSENGER CAR: motorcycles, boats, RVs, ATVs, scooters, golf carts, jet skis, snowmobiles, trailers — use the vehicle type as the reason.
(2) SALVAGE/BRANDED TITLE: listing mentions salvage, rebuilt, junk, branded, or flood title — use 'salvage title'.
(3) ENGINE ISSUES: explicit (blown engine, rod knock, head gasket, seized, needs engine) or implied (overheating, white smoke, burns oil, runs rough, misfires, won't start) — use 'engine issue'.
(4) PARTS LISTING: listing is selling a car part or accessory (bed cap, bumper, wheels, engine, etc.) not an actual vehicle — use 'parts listing'.
`,
              },
              private_party_market_value: {
                type: "integer",
                description: `What this specific vehicle would realistically sell for in a completed Facebook Marketplace or Craigslist transaction — not KBB, not asking price, but actual final sale price between private individuals. Apply ALL of the following rules:

(1) PESSIMISTIC REPAIR RULE: any mechanical, electrical, or drivability issues → use high-end OEM parts + professional labor costs. Hidden issues compound; protect downside by default.

(2) MILEAGE MARGIN CAP: over 150k miles → aggressively cap the resale ceiling. Never project profit exceeding $2,000–$3,000 on 150k+ mile vehicles unless purchase price is near zero.

(3) VALUE MIDDLEMAN REALITY CHECK: high-mileage reliable vehicles (Toyota, Honda, Lexus) retain a cash floor. Recognize a genuine micro-deal ($500 under floor) vs. a poor deal.

(4) COSMETIC CONDITION DISCOUNT: visible cosmetic damage has a real impact on resale speed and price. Heavy paint fading, scratched/dented panels, worn interior, or "beater grade" appearance signals a car that will only sell to bottom-of-market buyers. Apply a meaningful discount (15–30%) vs. a clean equivalent — a cosmetically rough car is not worth the same as a clean one even if it runs fine.

(5) NICHE/SLOW-MOVING VEHICLES: luxury brands (Mercedes, BMW, Audi), sports cars, and uncommon models have a narrower buyer pool on Marketplace. They take longer to sell and require price cuts to move. Compress the margin expectation accordingly vs. a high-demand economy car (Camry, Civic, Corolla, CR-V).

(6) DEALER/RESELLER LISTINGS: if the listing appears to be from a dealer or reseller (templated sales copy, no personal reason for selling, mentions other inventory, reads like lot advertising), assume the car is already priced at or near its true market value with little room left — apply a 20–30% additional discount to the resale ceiling since flippers cannot expect to buy below market from another reseller.

(7) LOW-DEMAND VEHICLES: hydrogen vehicles (Toyota Mirai, Hyundai Nexo) and early-gen EVs (BMW i3 pre-2018, early Nissan Leaf) have very limited buyer pools and slow sales velocity — apply a heavy 30–40% discount to any raw market estimate to reflect realistic street-level demand.

(6) VAGUE DESCRIPTION PENALTY: fewer than ~50 words with no mention of condition, history, or maintenance → treat as potential problem vehicle, apply 20–30% additional discount.

A significant fraction of FB Marketplace listings are overpriced and will never sell at asking. Your estimate must reflect true street-level demand. Return 0 only if you truly cannot estimate.`,
              },
              price_justification: {
                type: "string",
                description: "2-3 sentences explaining your price estimate: what comparable vehicles sell for, which specific rules applied (pessimistic repair, mileage cap, cosmetic discount, niche vehicle, etc.), and what pushed the estimate up or down.",
              },
            },
            required: ["is_passenger_car", "skip_reason", "private_party_market_value", "price_justification"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "evaluate_listing" },
      messages: [
        {
          role: "user",
          content: `You are an expert automotive sourcing and valuation AI for a car flipping operation. Your job is to filter out bad listings and estimate true private-party resale values so a flipper can identify profitable deals quickly.

SKIP the listing (set skip_reason) if any of the following apply:
- Not a passenger vehicle (motorcycle, boat, RV, ATV, etc.)
- Salvage, rebuilt, branded, or flood title
- Engine issues — explicit (blown engine, rod knock, head gasket) or implied (overheating, white smoke, runs rough, won't start)
- Listing is selling a car PART or accessory, not the vehicle itself
VALUATION RULES (for listings that pass the skip check):
1. PESSIMISTIC REPAIR: any mentioned mechanical/electrical issue → use worst-case repair cost (OEM parts + shop labor). Issues compound.
2. MILEAGE CAP: 150k+ miles → hard cap on resale ceiling, max $2–3k projected profit regardless of brand.
3. CASH FLOOR: reliable high-mileage vehicles (Toyota, Honda, Lexus) retain a floor value — recognize a micro-deal priced just under that floor.
4. COSMETIC DISCOUNT: heavy paint fade, body damage, worn interior, or beater-grade appearance → 15–30% discount vs. a clean equivalent. Cosmetically rough cars only sell to bottom-of-market buyers at reduced prices.
5. NICHE PENALTY: luxury brands, sports cars, and uncommon models have a smaller buyer pool and take longer to sell → compress margin expectations vs. high-demand economy cars (Camry, Civic, CR-V).
6. DEALER/RESELLER DISCOUNT: if the listing looks like it's from a dealer or reseller (templated copy, no personal selling reason, mentions other inventory), assume it's already near true market value — apply an additional 20–30% discount to the resale ceiling.
7. LOW-DEMAND VEHICLE DISCOUNT: hydrogen vehicles (Mirai, Nexo) and early-gen EVs (BMW i3 pre-2018, early Leaf) have very limited buyer pools — apply a 30–40% discount to any raw market estimate.
6. VAGUE DESCRIPTION: fewer than ~50 words, no condition/history/maintenance info → treat as potential problem vehicle, apply 20–30% additional discount.

Estimate the actual completed private-party sale price — not KBB, not asking price. What would a real buyer actually pay today on Facebook Marketplace or Craigslist?

Title: ${title ?? "unknown"}
Year/Make/Model: ${year ?? "?"} ${make ?? "?"} ${model ?? "?"}
Mileage: ${mileageStr}
Description: ${desc}`,
        },
      ],
    });

    const toolUse = message.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      return { skip: false, marketValue: null, justification: null };
    }

    const result = toolUse.input as {
      is_passenger_car: boolean;
      skip_reason: string;
      private_party_market_value: number;
      price_justification: string;
    };

    if (!result.is_passenger_car) {
      return { skip: true, reason: result.skip_reason || "non-car listing" };
    }

    if (result.skip_reason) {
      return { skip: true, reason: result.skip_reason };
    }

    const marketValue = result.private_party_market_value > 0
      ? Math.round(result.private_party_market_value * 0.75)
      : null;

    if (!marketValue) {
      console.log("[valuation] no estimate for:", title, "| year:", year, "make:", make, "model:", model, "| desc length:", description?.length ?? 0);
    }

    return { skip: false, marketValue, justification: result.price_justification || null };
  } catch (err) {
    console.error("[valuation] error:", err instanceof Error ? err.message : err);
    return { skip: false, marketValue: null, justification: null };
  }
}
