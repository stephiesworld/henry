export interface SkuInput {
  id: string;
  asin: string;
  title: string;
  units: number; // monthly
  wholesale: number; // $/unit Amazon pays you
  cogs: number; // $/unit
  coopPct: number; // % of wholesale (co-op / accruals / allowances)
  freight: number; // $/unit inbound/freight
  chargebacks: number; // $/unit (allocated)
  returns: number; // $/unit (returns + damages)
  ads: number; // $/unit (allocated advertising)
}

export type SkuStatus = "healthy" | "watch" | "thin" | "loss";

export interface SkuMetrics extends SkuInput {
  coopDollar: number;
  netPPM: number;
  marginPct: number;
  monthlyRevenue: number;
  monthlyContribution: number;
  status: SkuStatus;
  foolsGold: boolean;
}

export interface Adjustments {
  wholesalePct: number; // +/- % to wholesale
  cogsPct: number; // +/- % to COGS
  coopPts: number; // +/- percentage points to co-op
  chargebacksPct: number; // +/- % to chargebacks
}

export const NO_ADJUST: Adjustments = { wholesalePct: 0, cogsPct: 0, coopPts: 0, chargebacksPct: 0 };

export function computeRow(r: SkuInput, adj: Adjustments = NO_ADJUST): SkuMetrics {
  const wholesale = r.wholesale * (1 + adj.wholesalePct / 100);
  const cogs = r.cogs * (1 + adj.cogsPct / 100);
  const coopPct = Math.max(0, r.coopPct + adj.coopPts);
  const chargebacks = Math.max(0, r.chargebacks * (1 + adj.chargebacksPct / 100));

  const coopDollar = wholesale * (coopPct / 100);
  const netPPM = wholesale - cogs - coopDollar - r.freight - chargebacks - r.returns - r.ads;
  const marginPct = wholesale > 0 ? (netPPM / wholesale) * 100 : 0;
  const monthlyRevenue = r.wholesale * r.units;
  const monthlyContribution = netPPM * r.units;

  let status: SkuStatus;
  if (netPPM <= 0) status = "loss";
  else if (marginPct < 5) status = "thin";
  else if (marginPct < 10) status = "watch";
  else status = "healthy";

  return {
    ...r,
    coopDollar,
    netPPM,
    marginPct,
    monthlyRevenue,
    monthlyContribution,
    status,
    foolsGold: false,
  };
}

export interface PortfolioSummary {
  rows: SkuMetrics[];
  totalRevenue: number;
  totalContribution: number;
  blendedMarginPct: number;
  lossCount: number;
  foolsGoldCount: number;
}

export function computePortfolio(inputs: SkuInput[], adj: Adjustments = NO_ADJUST): PortfolioSummary {
  const base = inputs.map((r) => computeRow(r, adj));
  // Fool's Gold: high revenue (>= median) but thin/zero margin (< 5%).
  const revenues = base.map((r) => r.monthlyRevenue).sort((a, b) => a - b);
  const median = revenues.length ? revenues[Math.floor(revenues.length / 2)] : 0;
  const rows = base.map((r) => ({
    ...r,
    foolsGold: r.monthlyRevenue >= median && r.marginPct < 5 && r.netPPM >= 0,
  }));

  const totalRevenue = rows.reduce((s, r) => s + r.monthlyRevenue, 0);
  const totalContribution = rows.reduce((s, r) => s + r.monthlyContribution, 0);
  const blendedMarginPct = totalRevenue > 0 ? (totalContribution / totalRevenue) * 100 : 0;

  return {
    rows,
    totalRevenue,
    totalContribution,
    blendedMarginPct,
    lossCount: rows.filter((r) => r.status === "loss").length,
    foolsGoldCount: rows.filter((r) => r.foolsGold).length,
  };
}

export const STATUS_LABEL: Record<SkuStatus, string> = {
  healthy: "Healthy",
  watch: "Watch",
  thin: "Thin",
  loss: "Loss",
};

let _id = 0;
export const newId = () => `sku-${_id++}-${Math.round(performance.now())}`;

const PNL_ALIASES: Record<keyof Omit<SkuInput, "id">, string[]> = {
  asin: ["asin", "product id", "sku"],
  title: ["title", "product", "name", "description"],
  units: ["units", "units/mo", "monthly units", "qty", "quantity", "volume"],
  wholesale: ["wholesale", "wholesale price", "wholesale cost", "price", "amazon price", "unit price"],
  cogs: ["cogs", "cost of goods", "landed cogs", "unit cost", "cost"],
  coopPct: ["coop", "co-op", "co-op %", "coop %", "coop pct", "allowance %", "accrual %"],
  freight: ["freight", "inbound", "freight/inbound", "shipping"],
  chargebacks: ["chargebacks", "chargeback", "deductions", "chargeb."],
  returns: ["returns", "returns/damages", "damages", "returns & damages"],
  ads: ["ads", "advertising", "ad spend", "ppc"],
};

function num(s: string): number {
  const n = parseFloat(String(s).replace(/[^0-9.\-]/g, ""));
  return isNaN(n) ? 0 : n;
}

/** Map loosely-named CSV rows into SkuInput[]. Lenient on column names. */
export function mapPnlRows(rawRows: Record<string, string>[]): SkuInput[] {
  return rawRows
    .map((raw) => {
      const lower: Record<string, string> = {};
      for (const k of Object.keys(raw)) lower[k.trim().toLowerCase()] = raw[k];
      const get = (aliases: string[]) => {
        for (const a of aliases) if (a in lower && lower[a] !== "") return lower[a];
        return "";
      };
      const wholesale = num(get(PNL_ALIASES.wholesale));
      const cogs = num(get(PNL_ALIASES.cogs));
      if (!wholesale && !cogs) return null;
      return {
        id: newId(),
        asin: get(PNL_ALIASES.asin),
        title: get(PNL_ALIASES.title) || get(PNL_ALIASES.asin) || "Imported SKU",
        units: num(get(PNL_ALIASES.units)),
        wholesale,
        cogs,
        coopPct: num(get(PNL_ALIASES.coopPct)),
        freight: num(get(PNL_ALIASES.freight)),
        chargebacks: num(get(PNL_ALIASES.chargebacks)),
        returns: num(get(PNL_ALIASES.returns)),
        ads: num(get(PNL_ALIASES.ads)),
      } as SkuInput;
    })
    .filter((r): r is SkuInput => r !== null);
}

export const SAMPLE_SKUS: SkuInput[] = [
  { id: "s1", asin: "B08N5WRWNW", title: "Coconut oil 16oz", units: 4200, wholesale: 9.4, cogs: 5.1, coopPct: 8, freight: 0.6, chargebacks: 0.5, returns: 0.2, ads: 0.8 },
  { id: "s2", asin: "B07FZ8S74R", title: "Water bottle 32oz", units: 9800, wholesale: 13.8, cogs: 7.9, coopPct: 10, freight: 0.7, chargebacks: 0.3, returns: 0.3, ads: 1.6 },
  { id: "s3", asin: "B09B8V1LZ3", title: "Memory foam pillow", units: 2100, wholesale: 28.5, cogs: 14.0, coopPct: 7, freight: 1.8, chargebacks: 0.4, returns: 1.1, ads: 2.2 },
  { id: "s4", asin: "B08L5VG843", title: "Bamboo cutting board set", units: 5600, wholesale: 18.2, cogs: 12.6, coopPct: 12, freight: 1.2, chargebacks: 0.9, returns: 0.6, ads: 2.1 },
  { id: "s5", asin: "B07PGL2N7J", title: "LED desk lamp", units: 1500, wholesale: 22.0, cogs: 17.5, coopPct: 9, freight: 1.4, chargebacks: 0.6, returns: 0.8, ads: 2.0 },
  { id: "s6", asin: "B09JQMJHXY", title: "Reusable storage bags 8pk", units: 7400, wholesale: 11.0, cogs: 6.8, coopPct: 11, freight: 0.5, chargebacks: 0.4, returns: 0.2, ads: 1.5 },
];
