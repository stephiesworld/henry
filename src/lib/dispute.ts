import type Anthropic from "@anthropic-ai/sdk";
import { ROOT_CAUSES, type RootCause } from "./chargebacks";

/**
 * Chargeback dispute drafting — the structured, evaluable path.
 *
 * The Generators tab streams a Markdown dispute (see api/generate/route.ts).
 * This module adds a *structured* version of the same workflow: same persona,
 * same fact assembly, but the model returns a validated JSON object instead of
 * free text. That contract is what makes the output gradeable in `evals/` —
 * fields like the PO reference and disputed amount either echo the source row
 * or they don't, no LLM judge required.
 *
 * `BASE_PERSONA`, `DISPUTE_SYSTEM_SUFFIX`, and `disputeFacts()` are imported by
 * the streaming route, so production and evals exercise one prompt.
 */

export const MODEL = "claude-opus-4-8";

export const BASE_PERSONA =
  "You are HENRY, a seasoned ex-Amazon CSM helping 1P vendors and 3P sellers. Be concrete, plain-English, and actionable. Output clean Markdown (##/### headings, **bold**, and - bullet lists). No preamble or sign-off.";

export const DISPUTE_SYSTEM_SUFFIX =
  " You draft 1P vendor chargeback disputes that are ready to paste into Vendor Central, framed to maximize approval.";

export interface DisputeInput {
  /** The chargeback type / deduction reason, as Amazon stated it. */
  type: string;
  /** PO or reference number from the source row. */
  reference: string;
  marketplace?: string;
  /** The vendor's account of what happened. */
  details?: string;
  /** Evidence the vendor says they have. */
  evidence?: string;
  /** Optional structured fields carried from the parsed chargeback row. */
  asin?: string;
  amount?: number;
}

/** The shared facts block — identical bytes feed the Markdown route and the structured path. */
export function disputeFacts(input: DisputeInput): string {
  return (
    `Chargeback type: ${input.type || "(unspecified)"}\n` +
    `PO / reference: ${input.reference || "(none given)"}\n` +
    `ASIN: ${input.asin || "(none given)"}\n` +
    `Deducted amount: ${input.amount != null ? "$" + input.amount.toFixed(2) : "(not given)"}\n` +
    `Marketplace: ${input.marketplace || "amazon.com"}\n` +
    `What happened (vendor's account): ${input.details || "(none given)"}\n` +
    `Evidence the vendor has: ${input.evidence || "(none listed)"}`
  );
}

/** Markdown user prompt used by the production streaming route. */
export function buildChargebackUserMarkdown(input: DisputeInput): string {
  return (
    `Draft a chargeback dispute for a 1P vendor.\n\n` +
    disputeFacts(input) +
    `\n\n` +
    `Produce:\n## Dispute narrative\nA tight, professional narrative to submit (reference the PO and chargeback type, state the facts, and assert why the deduction is invalid).\n\n` +
    `## Evidence to attach\nA checklist mapping each piece of evidence to what it proves for THIS chargeback type — and flag anything important the vendor is missing.\n\n` +
    `## Tips & deadline\nFiling-window reminder and 2–3 tips that improve approval odds for this chargeback type.`
  );
}

// ---- Structured path ----

export interface DisputeDraft {
  root_cause: RootCause;
  disputable: boolean;
  po_reference: string;
  asin: string;
  disputed_amount_usd: number;
  argument_summary: string;
  letter_body: string;
  evidence_to_attach: string[];
  missing_evidence: string[];
  filing_note: string;
  confidence: "high" | "medium" | "low";
}

const CAUSE_KEYS = Object.keys(ROOT_CAUSES) as RootCause[];

/** Strict tool the model must fill — this is the output contract the evals grade against. */
export const DISPUTE_TOOL = {
  name: "submit_dispute",
  description:
    "Return the structured chargeback dispute. Ground every field in the facts provided — never invent PO numbers, ASINs, amounts, or Amazon policy codes.",
  strict: true,
  input_schema: {
    type: "object" as const,
    additionalProperties: false,
    properties: {
      root_cause: {
        type: "string",
        enum: CAUSE_KEYS,
        description: "The root-cause bucket this chargeback falls into.",
      },
      disputable: {
        type: "boolean",
        description:
          "Whether this chargeback type is realistically winnable with evidence. Labeling/FNSKU and unclassified deductions usually are not.",
      },
      po_reference: {
        type: "string",
        description: 'The PO/reference exactly as given, or "(none given)" if none was provided. Do not invent one.',
      },
      asin: { type: "string", description: 'The ASIN if provided, else "".' },
      disputed_amount_usd: {
        type: "number",
        description: "The disputed dollar amount if provided, else 0.",
      },
      argument_summary: {
        type: "string",
        description: "One or two sentences: the core reason the deduction is invalid.",
      },
      letter_body: {
        type: "string",
        description: "The paste-ready dispute narrative for Vendor Central.",
      },
      evidence_to_attach: {
        type: "array",
        items: { type: "string" },
        description: "Evidence the vendor should attach, mapped to this root cause.",
      },
      missing_evidence: {
        type: "array",
        items: { type: "string" },
        description: "Important evidence the vendor did NOT list but should gather. Empty if nothing is missing.",
      },
      filing_note: {
        type: "string",
        description: "Filing-window reminder / next step.",
      },
      confidence: {
        type: "string",
        enum: ["high", "medium", "low"],
        description: "Confidence that this dispute would be approved.",
      },
    },
    required: [
      "root_cause",
      "disputable",
      "po_reference",
      "asin",
      "disputed_amount_usd",
      "argument_summary",
      "letter_body",
      "evidence_to_attach",
      "missing_evidence",
      "filing_note",
      "confidence",
    ],
  },
};

export function buildStructuredUser(input: DisputeInput): string {
  return (
    `Draft a chargeback dispute for a 1P vendor, then call submit_dispute with it.\n\n` +
    disputeFacts(input) +
    `\n\n` +
    `Rules:\n` +
    `- letter_body is the paste-ready narrative: reference the PO and chargeback type, state the facts, and assert why the deduction is invalid.\n` +
    `- Only use facts given above. Do not invent PO numbers, ASINs, dollar amounts, or Amazon policy section numbers.\n` +
    `- If the chargeback type is not realistically disputable, set disputable=false and be honest in the narrative rather than manufacturing a winning argument.\n` +
    `- Put evidence the vendor already has in evidence_to_attach, and anything important they're missing in missing_evidence.`
  );
}

// Strict tool schemas constrain shape, not presence — fields can still come
// back null, so gate the cast with a runtime check.
export function isDisputeDraft(x: unknown): x is DisputeDraft {
  if (typeof x !== "object" || x === null) return false;
  const d = x as Record<string, unknown>;
  return (
    typeof d.root_cause === "string" &&
    CAUSE_KEYS.includes(d.root_cause as RootCause) &&
    typeof d.disputable === "boolean" &&
    typeof d.po_reference === "string" &&
    typeof d.asin === "string" &&
    typeof d.disputed_amount_usd === "number" &&
    typeof d.argument_summary === "string" &&
    typeof d.letter_body === "string" &&
    Array.isArray(d.evidence_to_attach) &&
    d.evidence_to_attach.every((e) => typeof e === "string") &&
    Array.isArray(d.missing_evidence) &&
    d.missing_evidence.every((e) => typeof e === "string") &&
    typeof d.filing_note === "string" &&
    (d.confidence === "high" || d.confidence === "medium" || d.confidence === "low")
  );
}

export interface DraftResult {
  draft: DisputeDraft;
  usage: { input_tokens: number; output_tokens: number };
  latencyMs: number;
  model: string;
}

/**
 * Call the model and return a validated DisputeDraft.
 * Forces the submit_dispute tool so the response is always structured.
 */
export async function draftDispute(
  client: Anthropic,
  input: DisputeInput,
  model: string = MODEL,
): Promise<DraftResult> {
  const start = Date.now();
  const res = await client.messages.create({
    model,
    max_tokens: 2048,
    system: [
      {
        type: "text",
        text: BASE_PERSONA + DISPUTE_SYSTEM_SUFFIX,
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: [DISPUTE_TOOL as unknown as Anthropic.Tool],
    tool_choice: { type: "tool", name: DISPUTE_TOOL.name },
    messages: [{ role: "user", content: buildStructuredUser(input) }],
  });

  const block = res.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") {
    throw new Error("Model did not return the submit_dispute tool call.");
  }
  if (!isDisputeDraft(block.input)) {
    throw new Error("submit_dispute output failed runtime validation.");
  }

  return {
    draft: block.input,
    usage: {
      input_tokens: res.usage.input_tokens,
      output_tokens: res.usage.output_tokens,
    },
    latencyMs: Date.now() - start,
    model,
  };
}
