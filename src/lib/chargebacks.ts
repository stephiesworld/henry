export type RootCause = "ASN_MISMATCH" | "LABELING" | "CARTON_CONTENT" | "SHORTAGE" | "OTHER";

export interface RootCauseInfo {
  key: RootCause;
  label: string;
  disputable: boolean;
  fix: string;
  evidence: string[];
  /** Playbook id to link to (see lib/knowledge). */
  playbook?: string;
}

export const ROOT_CAUSES: Record<RootCause, RootCauseInfo> = {
  ASN_MISMATCH: {
    key: "ASN_MISMATCH",
    label: "ASN mismatch",
    disputable: true,
    fix: "Review your ASN submission timing — submit before carrier handoff, not after — and sync the ASN with what the 3PL actually ships.",
    evidence: ["Submitted ASN record", "Packing list", "Carrier tracking / BOL", "Barcode scan from shipment"],
    playbook: "chargeback-disputes",
  },
  LABELING: {
    key: "LABELING",
    label: "Labeling / FNSKU",
    disputable: false,
    fix: "Audit the label template and FNSKU generation; run a label photo check before shipping and re-train the prep service.",
    evidence: ["Photo of applied label", "FNSKU generated from the shipment plan", "Label spec for the ASIN"],
    playbook: "fnsku-labeling",
  },
  CARTON_CONTENT: {
    key: "CARTON_CONTENT",
    label: "Carton content discrepancy",
    disputable: true,
    fix: "Add a QC check at the pack station and run random carton audits; verify case-pack quantities against the packing list.",
    evidence: ["Signed/timestamped packing list", "Photo of packed carton (contents + weight)", "Case-pack spec"],
    playbook: "chargeback-disputes",
  },
  SHORTAGE: {
    key: "SHORTAGE",
    label: "Shortage claim",
    disputable: true,
    fix: "Document every shipment with photos and weights; dispute with proof — shortages are often carrier/FC loss, not a shipping error.",
    evidence: ["Packing list (signed/timestamped)", "Photo of carton (contents + weight)", "Carrier tracking showing weight at pickup", "ASN matching qty/weight"],
    playbook: "chargeback-disputes",
  },
  OTHER: {
    key: "OTHER",
    label: "Other / unclassified",
    disputable: false,
    fix: "Manual review needed — read Amazon's stated reason and escalate to your vendor manager if it looks incorrect.",
    evidence: ["Amazon's stated reason", "Any supporting records you have"],
    playbook: "chargeback-disputes",
  },
};

const RULES: { cause: RootCause; keywords: string[] }[] = [
  { cause: "ASN_MISMATCH", keywords: ["asn", "advance shipment", "quantity discrepancy", "received different", "po quantity", "asn mismatch"] },
  { cause: "LABELING", keywords: ["label", "fnsku", "barcode", "sticker", "marking", "mislabel"] },
  { cause: "CARTON_CONTENT", keywords: ["carton content", "contents", "packing list", "case pack", "casepack", "carton"] },
  { cause: "SHORTAGE", keywords: ["shortage", "missing unit", "short ship", "received less", "under-received", "underreceived", "missing"] },
];

export function classifyReason(reason: string): { cause: RootCause; confidence: number } {
  const r = (reason || "").toLowerCase();
  for (const rule of RULES) {
    for (const kw of rule.keywords) {
      if (r.includes(kw)) {
        // longer keyword match = higher confidence
        return { cause: rule.cause, confidence: kw.length >= 8 ? 0.95 : 0.8 };
      }
    }
  }
  return { cause: "OTHER", confidence: 0.3 };
}

export interface Chargeback {
  id: string;
  date: string;
  reasonRaw: string;
  cause: RootCause;
  confidence: number;
  amount: number;
  orderId: string;
  asin: string;
  quantity: number;
  status: string;
}

const COL_ALIASES: Record<string, string[]> = {
  date: ["deduction date", "date", "charge date", "invoice date", "issue date"],
  reason: ["deduction reason", "reason", "issue type", "chargeback reason", "discrepancy type", "type"],
  amount: ["amount", "deduction amount", "chargeback amount", "charge amount", "value", "amount ($)"],
  orderId: ["order id", "po", "po number", "purchase order", "po #", "order"],
  asin: ["asin", "product id"],
  quantity: ["quantity", "qty", "units"],
  status: ["status", "state", "dispute status"],
};

function pick(row: Record<string, string>, keys: string[]): string {
  const lowerMap: Record<string, string> = {};
  for (const k of Object.keys(row)) lowerMap[k.trim().toLowerCase()] = row[k];
  for (const alias of keys) {
    if (alias in lowerMap && lowerMap[alias] != null && lowerMap[alias] !== "") return String(lowerMap[alias]);
  }
  return "";
}

function parseAmount(s: string): number {
  const n = parseFloat(String(s).replace(/[^0-9.\-]/g, ""));
  return isNaN(n) ? 0 : n;
}

export function mapRows(rawRows: Record<string, string>[]): { rows: Chargeback[]; missing: string[] } {
  const sample = rawRows[0] ?? {};
  const present = Object.keys(sample).map((k) => k.trim().toLowerCase());
  const missing: string[] = [];
  for (const field of ["reason", "amount"]) {
    const hit = COL_ALIASES[field].some((a) => present.includes(a));
    if (!hit) missing.push(field);
  }

  const rows: Chargeback[] = rawRows
    .map((raw, i) => {
      const reasonRaw = pick(raw, COL_ALIASES.reason);
      const amount = parseAmount(pick(raw, COL_ALIASES.amount));
      if (!reasonRaw && !amount) return null;
      const { cause, confidence } = classifyReason(reasonRaw);
      return {
        id: `cb-${i}`,
        date: pick(raw, COL_ALIASES.date),
        reasonRaw,
        cause,
        confidence,
        amount,
        orderId: pick(raw, COL_ALIASES.orderId),
        asin: pick(raw, COL_ALIASES.asin),
        quantity: parseInt(pick(raw, COL_ALIASES.quantity) || "0", 10) || 0,
        status: (pick(raw, COL_ALIASES.status) || "pending").toLowerCase(),
      } as Chargeback;
    })
    .filter((r): r is Chargeback => r !== null);

  return { rows, missing };
}

export interface CauseBreakdown {
  cause: RootCause;
  count: number;
  amount: number;
  pct: number; // of total $
}

export interface RedFlag {
  text: string;
}

export interface Analysis {
  total: number;
  totalAmount: number;
  count: number;
  byCause: CauseBreakdown[];
  redFlags: RedFlag[];
  disputable: Chargeback[];
  disputableAmount: number;
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function analyze(rows: Chargeback[]): Analysis {
  const totalAmount = rows.reduce((s, r) => s + r.amount, 0);
  const byCauseMap = new Map<RootCause, { count: number; amount: number }>();
  for (const r of rows) {
    const e = byCauseMap.get(r.cause) ?? { count: 0, amount: 0 };
    e.count++;
    e.amount += r.amount;
    byCauseMap.set(r.cause, e);
  }
  const byCause: CauseBreakdown[] = [...byCauseMap.entries()]
    .map(([cause, e]) => ({ cause, count: e.count, amount: e.amount, pct: totalAmount ? (e.amount / totalAmount) * 100 : 0 }))
    .sort((a, b) => b.amount - a.amount);

  const redFlags: RedFlag[] = [];

  // Recurring ASIN
  const asinCount = new Map<string, number>();
  for (const r of rows) if (r.asin) asinCount.set(r.asin, (asinCount.get(r.asin) ?? 0) + 1);
  for (const [asin, n] of asinCount) {
    if (n >= 3) redFlags.push({ text: `${asin} appears ${n}× — likely an ASIN-specific spec or process issue. Investigate this SKU.` });
  }

  // Weekday concentration
  const dow = new Array(7).fill(0);
  let dated = 0;
  for (const r of rows) {
    const d = new Date(r.date);
    if (!isNaN(d.getTime())) {
      dow[d.getDay()]++;
      dated++;
    }
  }
  if (dated >= 5) {
    const maxIdx = dow.indexOf(Math.max(...dow));
    if (dow[maxIdx] / dated >= 0.35 && dow[maxIdx] >= 3) {
      redFlags.push({ text: `Chargebacks cluster on ${WEEKDAYS[maxIdx]}s (${dow[maxIdx]} of ${dated}). Check that day's shipping / 3PL workflow.` });
    }
  }

  // Dominant cause
  if (byCause[0] && byCause[0].pct >= 35 && rows.length >= 4) {
    redFlags.push({ text: `${ROOT_CAUSES[byCause[0].cause].label} is ${Math.round(byCause[0].pct)}% of your chargeback dollars — the highest-leverage fix.` });
  }

  const disputable = rows.filter((r) => ROOT_CAUSES[r.cause].disputable && r.status !== "resolved");
  const disputableAmount = disputable.reduce((s, r) => s + r.amount, 0);

  return {
    total: rows.length,
    totalAmount,
    count: rows.length,
    byCause,
    redFlags,
    disputable,
    disputableAmount,
  };
}

export const SAMPLE_CSV = `Deduction Date,Deduction Reason,Amount,Order ID,ASIN,Quantity,Status
2026-05-07,ASN Mismatch - received different quantity than ASN,420.00,PO-7741AB,B08N5WRWNW,48,Pending
2026-05-14,ASN quantity discrepancy vs PO,380.00,PO-7782CD,B08N5WRWNW,36,Pending
2026-05-21,ASN mismatch on inbound shipment,295.00,PO-7810EF,B07FZ8S74R,24,Pending
2026-05-28,Advance Shipment Notice quantity discrepancy,510.00,PO-7844GH,B08N5WRWNW,60,Pending
2026-05-12,Missing FNSKU label on units,160.00,PO-7768IJ,B09B8V1LZ3,20,Pending
2026-05-19,Incorrect barcode / label not scannable,140.00,PO-7799KL,B09B8V1LZ3,18,Resolved
2026-05-26,Mislabeled units - wrong FNSKU,175.00,PO-7833MN,B09B8V1LZ3,22,Pending
2026-05-09,Carton content discrepancy - contents do not match packing list,230.00,PO-7755OP,B08L5VG843,40,Pending
2026-05-16,Case pack quantity incorrect,190.00,PO-7790QR,B07PGL2N7J,30,Pending
2026-05-23,Shortage claim - received fewer units than billed,310.00,PO-7820ST,B09JQMJHXY,50,Pending
2026-05-30,Short shipment - missing units,275.00,PO-7850UV,B07PGL2N7J,44,Pending
2026-05-11,Shortage - units missing on receipt,205.00,PO-7762WX,B08L5VG843,33,Pending
2026-05-18,Prep fee - non-compliance,95.00,PO-7795YZ,B07FZ8S74R,12,Pending
2026-05-25,Co-op accrual adjustment,120.00,PO-7828AA,B09B8V1LZ3,0,Resolved`;
