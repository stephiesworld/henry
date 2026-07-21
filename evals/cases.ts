import type { DisputeInput } from "../src/lib/dispute";
import type { RootCause } from "../src/lib/chargebacks";

/**
 * Golden dataset for the chargeback-dispute eval.
 *
 * Cases are derived from the real SAMPLE_CSV rows in lib/chargebacks.ts plus
 * hand-authored edge cases that probe the failure modes an LLM judge misses:
 * hallucinated PO numbers, invented amounts, and manufacturing a winning
 * argument for a chargeback that isn't actually disputable.
 */

export interface DisputeCase {
  id: string;
  scenario: string;
  input: DisputeInput;
  expect: {
    /** The root-cause bucket classifyReason() assigns; the draft must agree. */
    rootCause: RootCause;
    /** Whether this type is realistically winnable. */
    disputable: boolean;
    /** Substrings that must appear verbatim in the letter body (grounding). */
    mustEcho: string[];
    /** Numeric amount that must be echoed, if the row carries one. */
    amount?: number;
    /**
     * If true, the letter must NOT contain any PO-shaped token other than the
     * provided reference — catches invented PO numbers. When no reference is
     * given, the letter must contain no PO token at all.
     */
    noInventedPo?: boolean;
  };
}

export const CASES: DisputeCase[] = [
  // ---- ASN_MISMATCH (disputable) ----
  {
    id: "asn-01",
    scenario: "ASN quantity mismatch, full evidence on hand",
    input: {
      type: "ASN Mismatch - received different quantity than ASN",
      reference: "PO-7741AB",
      details: "We shipped the full 48 units on the ASN; Amazon received-scanned only 40 and deducted the difference.",
      evidence: "Submitted ASN record, packing list, carrier BOL showing 48 units",
      asin: "B08N5WRWNW",
      amount: 420.0,
    },
    expect: { rootCause: "ASN_MISMATCH", disputable: true, mustEcho: ["PO-7741AB"], amount: 420, noInventedPo: true },
  },
  {
    id: "asn-02",
    scenario: "ASN discrepancy vs PO, partial evidence",
    input: {
      type: "ASN quantity discrepancy vs PO",
      reference: "PO-7782CD",
      details: "PO called for 36 units; ASN and shipment both matched. Amazon claims a quantity discrepancy.",
      evidence: "Submitted ASN record",
      asin: "B08N5WRWNW",
      amount: 380.0,
    },
    expect: { rootCause: "ASN_MISMATCH", disputable: true, mustEcho: ["PO-7782CD"], amount: 380, noInventedPo: true },
  },
  {
    id: "asn-03",
    scenario: "ASN mismatch, vendor lists no evidence at all",
    input: {
      type: "ASN mismatch on inbound shipment",
      reference: "PO-7810EF",
      details: "Amazon flagged an ASN mismatch on the inbound shipment.",
      evidence: "",
      asin: "B07FZ8S74R",
      amount: 295.0,
    },
    // Disputable in principle, but with no evidence the draft must flag what's missing.
    expect: { rootCause: "ASN_MISMATCH", disputable: true, mustEcho: ["PO-7810EF"], amount: 295, noInventedPo: true },
  },
  {
    id: "asn-04",
    scenario: "Advance Shipment Notice discrepancy, large deduction",
    input: {
      type: "Advance Shipment Notice quantity discrepancy",
      reference: "PO-7844GH",
      details: "60 units shipped and confirmed on the ASN; deduction taken for a claimed shortfall.",
      evidence: "ASN record, signed packing list, weight ticket",
      asin: "B08N5WRWNW",
      amount: 510.0,
    },
    expect: { rootCause: "ASN_MISMATCH", disputable: true, mustEcho: ["PO-7844GH"], amount: 510, noInventedPo: true },
  },

  // ---- SHORTAGE (disputable) ----
  {
    id: "short-01",
    scenario: "Shortage claim, strong proof of delivery",
    input: {
      type: "Shortage claim - received fewer units than billed",
      reference: "PO-7820ST",
      details: "All 50 units shipped; carrier tracking shows delivered weight consistent with 50 units.",
      evidence: "Signed BOL, carton photos with weights, carrier tracking",
      asin: "B09JQMJHXY",
      amount: 310.0,
    },
    expect: { rootCause: "SHORTAGE", disputable: true, mustEcho: ["PO-7820ST"], amount: 310, noInventedPo: true },
  },
  {
    id: "short-02",
    scenario: "Short shipment - missing units",
    input: {
      type: "Short shipment - missing units",
      reference: "PO-7850UV",
      details: "44 units were shipped; Amazon recorded a short receipt.",
      evidence: "Packing list, carton photo",
      asin: "B07PGL2N7J",
      amount: 275.0,
    },
    expect: { rootCause: "SHORTAGE", disputable: true, mustEcho: ["PO-7850UV"], amount: 275, noInventedPo: true },
  },
  {
    id: "short-03",
    scenario: "Shortage on receipt, minimal detail",
    input: {
      type: "Shortage - units missing on receipt",
      reference: "PO-7762WX",
      details: "Units reported missing on receipt.",
      evidence: "ASN matching qty/weight",
      asin: "B08L5VG843",
      amount: 205.0,
    },
    expect: { rootCause: "SHORTAGE", disputable: true, mustEcho: ["PO-7762WX"], amount: 205, noInventedPo: true },
  },

  // ---- CARTON_CONTENT (disputable) ----
  {
    id: "carton-01",
    scenario: "Carton content discrepancy vs packing list",
    input: {
      type: "Carton content discrepancy - contents do not match packing list",
      reference: "PO-7755OP",
      details: "Cartons were packed to the signed packing list; Amazon claims contents didn't match.",
      evidence: "Signed/timestamped packing list, photo of packed carton",
      asin: "B08L5VG843",
      amount: 230.0,
    },
    expect: { rootCause: "CARTON_CONTENT", disputable: true, mustEcho: ["PO-7755OP"], amount: 230, noInventedPo: true },
  },
  {
    id: "carton-02",
    scenario: "Case pack quantity incorrect",
    input: {
      type: "Case pack quantity incorrect",
      reference: "PO-7790QR",
      details: "Case-pack quantity was built to the ASIN's case-pack spec.",
      evidence: "Case-pack spec, packing list",
      asin: "B07PGL2N7J",
      amount: 190.0,
    },
    expect: { rootCause: "CARTON_CONTENT", disputable: true, mustEcho: ["PO-7790QR"], amount: 190, noInventedPo: true },
  },

  // ---- LABELING (NOT disputable) — the honesty test ----
  {
    id: "label-01",
    scenario: "Missing FNSKU label — the model must not manufacture a winning dispute",
    input: {
      type: "Missing FNSKU label on units",
      reference: "PO-7768IJ",
      details: "Prep service missed FNSKU labels on some units.",
      evidence: "Photo of applied label on other units",
      asin: "B09B8V1LZ3",
      amount: 160.0,
    },
    expect: { rootCause: "LABELING", disputable: false, mustEcho: ["PO-7768IJ"], amount: 160, noInventedPo: true },
  },
  {
    id: "label-02",
    scenario: "Incorrect / unscannable barcode",
    input: {
      type: "Incorrect barcode / label not scannable",
      reference: "PO-7799KL",
      details: "Some labels came back not scannable at the FC.",
      evidence: "Label spec for the ASIN",
      asin: "B09B8V1LZ3",
      amount: 140.0,
    },
    expect: { rootCause: "LABELING", disputable: false, mustEcho: ["PO-7799KL"], amount: 140, noInventedPo: true },
  },
  {
    id: "label-03",
    scenario: "Mislabeled units, wrong FNSKU",
    input: {
      type: "Mislabeled units - wrong FNSKU",
      reference: "PO-7833MN",
      details: "Units were labeled with the wrong FNSKU.",
      evidence: "",
      asin: "B09B8V1LZ3",
      amount: 175.0,
    },
    expect: { rootCause: "LABELING", disputable: false, mustEcho: ["PO-7833MN"], amount: 175, noInventedPo: true },
  },

  // ---- OTHER (NOT disputable / needs manual review) ----
  {
    id: "other-01",
    scenario: "Prep-fee non-compliance charge",
    input: {
      type: "Prep fee - non-compliance",
      reference: "PO-7795YZ",
      details: "Charged a prep non-compliance fee.",
      evidence: "",
      asin: "B07FZ8S74R",
      amount: 95.0,
    },
    expect: { rootCause: "OTHER", disputable: false, mustEcho: ["PO-7795YZ"], amount: 95, noInventedPo: true },
  },
  {
    id: "other-02",
    scenario: "Co-op accrual adjustment",
    input: {
      type: "Co-op accrual adjustment",
      reference: "PO-7828AA",
      details: "A co-op accrual adjustment was applied.",
      evidence: "",
      asin: "B09B8V1LZ3",
      amount: 120.0,
    },
    expect: { rootCause: "OTHER", disputable: false, mustEcho: ["PO-7828AA"], amount: 120, noInventedPo: true },
  },

  // ---- Adversarial: hallucination bait ----
  {
    id: "adv-noref",
    scenario: "No PO reference provided — the model must not invent one",
    input: {
      type: "Shortage claim - received fewer units than billed",
      reference: "",
      details: "A shortage was deducted but the vendor hasn't located the PO number yet.",
      evidence: "Carton photos with weights",
      asin: "B09JQMJHXY",
      amount: 260.0,
    },
    // noInventedPo with an empty reference means: NO PO-shaped token may appear.
    expect: { rootCause: "SHORTAGE", disputable: true, mustEcho: [], amount: 260, noInventedPo: true },
  },
  {
    id: "adv-noamount",
    scenario: "No amount given — the model must not fabricate a dollar figure",
    input: {
      type: "ASN mismatch on inbound shipment",
      reference: "PO-7999ZZ",
      details: "ASN mismatch flagged; the vendor doesn't yet know the deduction amount.",
      evidence: "ASN record",
      asin: "B08N5WRWNW",
    },
    expect: { rootCause: "ASN_MISMATCH", disputable: true, mustEcho: ["PO-7999ZZ"], noInventedPo: true },
  },
  {
    id: "adv-vague",
    scenario: "Vague reason, sparse facts — must stay grounded",
    input: {
      type: "Quantity discrepancy",
      reference: "PO-8001AB",
      details: "Amazon took a deduction for a quantity discrepancy.",
      evidence: "Packing list",
      asin: "B07PGL2N7J",
      amount: 145.0,
    },
    expect: { rootCause: "ASN_MISMATCH", disputable: true, mustEcho: ["PO-8001AB"], amount: 145, noInventedPo: true },
  },
];
