import type { AnalyzeResponse, AsinAnalysis, BuyBoxType } from "./types";

const VARIANCE_THRESHOLD = 5; // percent
const DAY_MS = 24 * 60 * 60 * 1000;

// Keepa epoch: minutes since 2011-01-01. Convert a Keepa-minute to unix ms.
const KEEPA_EPOCH_OFFSET = 21564000;
const keepaMinuteToMs = (m: number) => (m + KEEPA_EPOCH_OFFSET) * 60000;

// Known Amazon retail seller IDs (amazon.com + a few EU marketplaces).
const AMAZON_SELLER_IDS = new Set([
  "ATVPDKIKX0DER", // amazon.com
  "A3P5ROKL5A1OLE", // .de
  "A1F83G8C2ARO7P", // .co.uk
  "A13V1IB3VYF5JG", // .fr
]);

// Keepa `csv` price-type indices we care about.
const CSV_AMAZON = 0;
const CSV_NEW = 1;
const CSV_BUYBOX = 18; // buy box price incl. shipping

interface KeepaProduct {
  asin: string;
  title?: string;
  csv?: (number[] | null)[];
  buyBoxSellerIdHistory?: string[];
}

/** Parse a Keepa price-history csv row into [{ t: ms, price: dollars }]. */
function parseSeries(row: number[] | null | undefined): { t: number; price: number }[] {
  if (!row || row.length < 2) return [];
  const out: { t: number; price: number }[] = [];
  for (let i = 0; i < row.length - 1; i += 2) {
    const price = row[i + 1];
    if (price < 0) continue; // -1 = no data / no offer
    out.push({ t: keepaMinuteToMs(row[i]), price: price / 100 });
  }
  return out;
}

function lowSince(series: { t: number; price: number }[], cutoff: number): number | null {
  let low: number | null = null;
  for (const p of series) {
    if (p.t < cutoff) continue;
    if (low === null || p.price < low) low = p.price;
  }
  return low;
}

function rangeSince(
  series: { t: number; price: number }[],
  cutoff: number
): { min: number; max: number } | null {
  let min: number | null = null;
  let max: number | null = null;
  for (const p of series) {
    if (p.t < cutoff) continue;
    if (min === null || p.price < min) min = p.price;
    if (max === null || p.price > max) max = p.price;
  }
  if (min === null || max === null) return null;
  return { min, max };
}

function analyzeProduct(p: KeepaProduct | undefined, asin: string, now: number): AsinAnalysis {
  if (!p || !p.csv) {
    return {
      asin,
      found: false,
      title: null,
      currentPrice: null,
      low30: null,
      low60: null,
      buyBoxWinner: null,
      buyBoxType: "none",
      hasFeaturedOffer: false,
      variance30Pct: null,
      highVariance: false,
      note: "Not found in Keepa (check the ASIN / marketplace).",
    };
  }

  // Prefer the buy-box series; fall back to NEW, then Amazon's own price.
  const buyBox = parseSeries(p.csv[CSV_BUYBOX]);
  const series = buyBox.length
    ? buyBox
    : parseSeries(p.csv[CSV_NEW]).length
      ? parseSeries(p.csv[CSV_NEW])
      : parseSeries(p.csv[CSV_AMAZON]);

  const cutoff30 = now - 30 * DAY_MS;
  const cutoff60 = now - 60 * DAY_MS;

  const currentPrice = series.length ? series[series.length - 1].price : null;
  const low30 = lowSince(series, cutoff30);
  const low60 = lowSince(series, cutoff60);

  const range30 = rangeSince(series, cutoff30);
  const variance30Pct =
    range30 && range30.min > 0
      ? Math.round(((range30.max - range30.min) / range30.min) * 1000) / 10
      : null;

  // Buy-box winner from the seller-id history (last entry = current).
  let buyBoxWinner: string | null = null;
  let buyBoxType: BuyBoxType = "none";
  const sellerHist = p.buyBoxSellerIdHistory;
  let currentSeller: string | null = null;
  if (sellerHist && sellerHist.length >= 2) {
    currentSeller = sellerHist[sellerHist.length - 1];
  }

  const hasFeaturedOffer =
    !!currentSeller && currentSeller !== "-1" && currentSeller !== "" && buyBox.length > 0;

  if (hasFeaturedOffer && currentSeller) {
    if (AMAZON_SELLER_IDS.has(currentSeller) || currentSeller === "-2") {
      buyBoxWinner = "Amazon";
      buyBoxType = "amazon";
    } else {
      buyBoxWinner = `3rd-party seller (${currentSeller})`;
      buyBoxType = "third-party";
    }
  }

  return {
    asin,
    found: true,
    title: p.title ?? null,
    currentPrice,
    low30,
    low60,
    buyBoxWinner,
    buyBoxType,
    hasFeaturedOffer,
    variance30Pct,
    highVariance: variance30Pct !== null && variance30Pct > VARIANCE_THRESHOLD,
  };
}

async function fetchFromKeepa(asins: string[], key: string): Promise<AsinAnalysis[]> {
  const domain = process.env.KEEPA_DOMAIN || "1";
  const now = Date.now();
  const url =
    `https://api.keepa.com/product?key=${key}&domain=${domain}` +
    `&asin=${asins.join(",")}&buybox=1&history=1&stats=90`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Keepa responded ${res.status}`);
  }
  const data = (await res.json()) as { products?: KeepaProduct[] };
  const byAsin = new Map<string, KeepaProduct>();
  for (const p of data.products ?? []) byAsin.set(p.asin, p);

  return asins.map((asin) => analyzeProduct(byAsin.get(asin), asin, now));
}

// ---------------------------------------------------------------------------
// Demo mode — deterministic, realistic-looking data so the app runs with no key.
// ---------------------------------------------------------------------------

function seedFrom(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function makeRng(seed: number) {
  let s = seed;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const DEMO_TITLES = [
  "Stainless Steel Insulated Water Bottle, 32oz",
  "Organic Cold-Pressed Coconut Oil, 16 fl oz",
  "Wireless Charging Pad, 15W Fast Charge",
  "Bamboo Cutting Board Set (3-Piece)",
  "Memory Foam Pillow, Queen, Cooling Gel",
  "LED Desk Lamp with USB Port, Dimmable",
  "Reusable Silicone Food Storage Bags (8-Pack)",
  "Pet Grooming Glove, Deshedding, Pair",
];

function demoAnalyze(asin: string): AsinAnalysis {
  const rng = makeRng(seedFrom(asin));
  const base = 12 + Math.floor(rng() * 80); // $12–$92
  const current = Math.round(base * (0.9 + rng() * 0.2) * 100) / 100;
  const low30 = Math.round(current * (0.93 - rng() * 0.05) * 100) / 100;
  const low60 = Math.round(Math.min(low30, current * (0.9 - rng() * 0.06)) * 100) / 100;

  const variance30Pct = Math.round((1 + rng() * 14) * 10) / 10; // 1%–15%

  const roll = rng();
  let buyBoxType: BuyBoxType;
  let buyBoxWinner: string | null;
  let hasFeaturedOffer = true;
  if (roll < 0.18) {
    buyBoxType = "none";
    buyBoxWinner = null;
    hasFeaturedOffer = false;
  } else if (roll < 0.55) {
    buyBoxType = "amazon";
    buyBoxWinner = "Amazon";
  } else {
    buyBoxType = "third-party";
    const sellers = ["DealZone LLC", "PrimeSupply Co", "RetailNova", "QuickShip Direct"];
    buyBoxWinner = `${sellers[Math.floor(rng() * sellers.length)]} (3P)`;
  }

  return {
    asin,
    found: true,
    title: DEMO_TITLES[seedFrom(asin) % DEMO_TITLES.length],
    currentPrice: hasFeaturedOffer ? current : null,
    low30: hasFeaturedOffer ? low30 : null,
    low60: hasFeaturedOffer ? low60 : null,
    buyBoxWinner,
    buyBoxType,
    hasFeaturedOffer,
    variance30Pct,
    highVariance: variance30Pct > VARIANCE_THRESHOLD,
    note: "Demo data — add KEEPA_API_KEY for live pricing.",
  };
}

export async function analyzeAsins(
  asins: string[],
  keyOverride?: string
): Promise<AnalyzeResponse> {
  const clean = Array.from(
    new Set(
      asins
        .map((a) => a.trim().toUpperCase())
        .filter((a) => /^[A-Z0-9]{10}$/.test(a))
    )
  ).slice(0, 100);

  // A user-supplied (BYOK) key takes precedence over the server's shared key.
  const key = (keyOverride && keyOverride.trim()) || process.env.KEEPA_API_KEY;

  if (key) {
    try {
      const results = await fetchFromKeepa(clean, key);
      return { source: "keepa", results };
    } catch (err) {
      // Fall through to demo data, but tag the failure on the first row.
      const results = clean.map(demoAnalyze);
      if (results[0]) {
        results[0].note = `Keepa request failed (${(err as Error).message}); showing demo data.`;
      }
      return { source: "demo", results };
    }
  }

  return { source: "demo", results: clean.map(demoAnalyze) };
}
