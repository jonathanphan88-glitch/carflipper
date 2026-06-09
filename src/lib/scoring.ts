const CURRENT_YEAR = new Date().getFullYear();

const GREEN_FLAG_KEYWORDS = [
  "runs great",
  "runs well",
  "clean title",
  "new tires",
  "one owner",
  "1 owner",
  "no accidents",
  "non-smoker",
  "garage kept",
  "well maintained",
  "highway miles",
  "recently serviced",
  "new battery",
  "new brakes",
];

const RED_FLAG_KEYWORDS = [
  "needs work",
  "as-is",
  "as is",
  "parts only",
  "parts car",
  "salvage",
  "no title",
  "rebuilt title",
  "flood",
  "frame damage",
  "does not run",
  "doesn't run",
  "project car",
  "non-runner",
  "engine issues",
  "transmission issues",
];

function scoreMarketValue(askingPrice: number, marketValue: number): number {
  if (marketValue <= 0) return 50;
  const ratio = askingPrice / marketValue;
  // ratio < 0.6 → 100, ratio = 1.0 → 0, linear interpolation
  if (ratio <= 0.6) return 100;
  if (ratio >= 1.0) return 0;
  return Math.round((1 - (ratio - 0.6) / 0.4) * 100);
}

function scoreMileage(mileage: number, year: number): number {
  const age = CURRENT_YEAR - year;
  // Expected miles per year: ~12,000
  const expectedMiles = age * 12000;
  if (expectedMiles <= 0) return 50;
  const ratio = mileage / expectedMiles;
  // ratio < 0.5 → 100, ratio = 1.5 → 0
  if (ratio <= 0.5) return 100;
  if (ratio >= 1.5) return 0;
  return Math.round((1 - (ratio - 0.5)) * 100);
}

function scoreAge(year: number): number {
  const age = CURRENT_YEAR - year;
  // 0-2 years → 100, 15+ years → 0
  if (age <= 2) return 100;
  if (age >= 15) return 0;
  return Math.round(((15 - age) / 13) * 100);
}

function scoreCondition(text: string): number {
  const lower = text.toLowerCase();
  let score = 50;
  for (const kw of GREEN_FLAG_KEYWORDS) {
    if (lower.includes(kw)) score += 10;
  }
  for (const kw of RED_FLAG_KEYWORDS) {
    if (lower.includes(kw)) score -= 20;
  }
  return Math.max(0, Math.min(100, score));
}

export interface ScoreInput {
  price?: number;
  marketValue?: number | null;
  mileage?: number | null;
  year?: number | null;
  conditionText?: string | null;
}

export function computeScore(input: ScoreInput): number {
  const { price, marketValue, mileage, year, conditionText } = input;

  const hasMarket = price != null && marketValue != null && marketValue > 0;
  const hasYear = year != null;
  const hasMileage = mileage != null && mileage > 0;
  const conditionScore = conditionText ? scoreCondition(conditionText) : 50;

  // When market value is available it dominates — that's the core signal for flipping
  if (hasMarket) {
    const marketScore = scoreMarketValue(price!, marketValue!);

    if (hasYear && hasMileage) {
      return Math.round(
        marketScore * 0.55 +
        scoreMileage(mileage!, year!) * 0.20 +
        scoreAge(year!) * 0.10 +
        conditionScore * 0.15
      );
    }
    if (hasYear) {
      return Math.round(
        marketScore * 0.65 +
        scoreAge(year!) * 0.20 +
        conditionScore * 0.15
      );
    }
    return Math.round(marketScore * 0.80 + conditionScore * 0.20);
  }

  // No market value — score on what we have
  const scores: number[] = [];
  if (hasYear && hasMileage) scores.push(scoreMileage(mileage!, year!) * 0.50);
  if (hasYear) scores.push(scoreAge(year!) * 0.35);
  scores.push(conditionScore * 0.15);

  return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0)) : 50;
}

export function hasRedFlags(text: string): boolean {
  const lower = text.toLowerCase();
  return RED_FLAG_KEYWORDS.some((kw) => lower.includes(kw));
}
