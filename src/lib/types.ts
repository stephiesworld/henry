export type BuyBoxType = "amazon" | "third-party" | "none";

export interface AsinAnalysis {
  asin: string;
  found: boolean;
  title: string | null;
  /** Current buy-box price in dollars, or null if no offer. */
  currentPrice: number | null;
  /** Lowest buy-box price over the trailing 30 / 60 days, in dollars. */
  low30: number | null;
  low60: number | null;
  /** Who currently holds the buy box / featured offer. */
  buyBoxWinner: string | null;
  buyBoxType: BuyBoxType;
  /** True when a featured offer (buy box) exists. */
  hasFeaturedOffer: boolean;
  /** Price spread over the last 30 days as a percentage: (max-min)/min * 100. */
  variance30Pct: number | null;
  /** True when variance30Pct exceeds ±5%. */
  highVariance: boolean;
  note?: string;
}

export interface AnalyzeResponse {
  source: "keepa" | "demo";
  results: AsinAnalysis[];
}
