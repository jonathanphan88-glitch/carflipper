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
                description: "Set a reason to skip if: (1) not a passenger car — use the type (e.g. 'motorcycle', 'boat', 'RV'); (2) listing mentions a salvage title, rebuilt title, or junk title — use 'salvage title'; (3) the listing indicates engine problems — this includes explicit statements (blown engine, rod knock, head gasket, seized, needs engine, engine failure) AND implied signals (overheating, white smoke, burns oil, runs rough, misfires, won't start, major mechanical issues) — use 'engine issue'. Otherwise leave empty string.",
              },
              private_party_market_value: {
                type: "integer",
                description: "What this specific vehicle would realistically sell for in a completed Facebook Marketplace or Craigslist transaction — not the listing price, not KBB, but actual final sale price between private individuals. Apply these rules strictly: (1) PESSIMISTIC REPAIR RULE: if the description mentions any mechanical, electrical, or drivability issues (check engine light, suspension noise, transmission, etc.), model repair costs using the high-end OEM-parts + professional-labor estimate — hidden issues frequently compound, so protect downside by default; (2) MILEAGE MARGIN CAP: for vehicles over 150,000 miles, aggressively cap the resale ceiling regardless of brand reliability — high-mileage vehicles face a hard psychological price ceiling that compresses margins and slows sales velocity, so never project a net profit margin exceeding $2,000–$3,000 on 150k+ mile vehicles unless the purchase price is near zero; (3) VALUE MIDDLEMAN REALITY CHECK: do not assume high-mileage reliable vehicles (e.g. Lexus ES, Toyota Camry) depreciate linearly to zero — running/driving vehicles retain a cash floor value, and a flipper would recognize a listing priced $500 under that floor as a micro-deal worth taking. Beyond those rules: assume average condition unless explicitly stated otherwise, apply heavy discounts for age over 10 years, and treat vague/sparse descriptions (fewer than ~50 words, no mention of condition or maintenance) as a red flag requiring an additional 20–30% discount. A significant fraction of FB Marketplace listings are priced above what they will actually sell for — your estimate must reflect true street-level demand, not seller hopes. Return 0 only if you truly cannot estimate.",
              },
              price_justification: {
                type: "string",
                description: "2-3 sentences explaining your price estimate: what comparable vehicles sell for, which specific rules applied (pessimistic repair, mileage cap, cash floor), and what factors (mileage, age, condition, known reliability) pushed the estimate up or down.",
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
          content: `You are an expert automotive sourcing and valuation AI. Your role is to analyze used car listings to determine precise market values, project realistic repair/reconditioning costs, identify seller types, and calculate true profit margins for vehicle flippers.

Evaluate this vehicle listing using the following underwriting principles:

1. PESSIMISTIC REPAIR RULE: If the description notes any mechanical, electrical, or drivability issues, calculate using the HIGH-END repair cost estimate (premium OEM parts + professional shop labor). Hidden issues frequently compound upon disassembly — protect downside risk by default.

2. MILEAGE MARGIN CAP: For vehicles over 150,000 miles, aggressively cap the resale price ceiling regardless of brand reliability (even Toyota/Honda/Lexus). High-mileage vehicles have a hard psychological price ceiling for retail buyers that compresses margins and slows sales velocity. Never project a profit margin exceeding $2,000–$3,000 on 150k+ mile vehicles unless the purchase price is near zero.

3. VALUE MIDDLEMAN REALITY CHECK: Do not assume high-mileage reliable vehicles depreciate linearly to zero. Running/driving vehicles retain a baseline cash floor value. Determine whether a flipper would recognize this as a "micro-deal" (e.g., priced $500 under cash floor) versus a poor deal due to mileage alone.

Estimate the actual completed private-party sale price — not KBB, not asking price, but what a real buyer would pay a real seller on Facebook Marketplace or Craigslist today.

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
