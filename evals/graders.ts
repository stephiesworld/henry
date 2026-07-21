import type Anthropic from "@anthropic-ai/sdk";
import { ROOT_CAUSES } from "../src/lib/chargebacks";
import type { DisputeDraft } from "../src/lib/dispute";
import type { DisputeCase } from "./cases";

/**
 * Two graders:
 *  - deterministic(): programmatic, exact. Catches the failure mode judges miss —
 *    confidently wrong facts (invented PO numbers, wrong root cause, fabricated
 *    policy codes). No model call.
 *  - judge(): LLM-as-judge on a 1–5 rubric for the things code can't score
 *    (persuasiveness, correct strategy, tone, factual grounding).
 */

export interface Check {
  name: string;
  pass: boolean;
  critical: boolean;
  detail?: string;
}

// A PO/reference token: "PO" + separator + an alphanumeric run that contains a
// digit (PO-7782CD). Requiring a digit avoids matching the bare word "PO"
// followed by an ordinary word ("PO deduction").
const PO_TOKEN = /\bPO[-\s]?[A-Z0-9]*\d[A-Z0-9]*\b/gi;
// Fabricated-citation patterns: a dispute inventing "Section 4.2" or "Policy #1234"
// reads authoritative but is a hallucination unless it was in the source.
const FAKE_POLICY = /\b(?:section|policy|clause|article)\s+#?\d+(?:\.\d+)*\b/gi;

export function deterministic(c: DisputeCase, draft: DisputeDraft): Check[] {
  const checks: Check[] = [];
  const body = draft.letter_body ?? "";
  const haystack = `${body}\n${draft.argument_summary ?? ""}`;

  // 1. Schema shape
  checks.push({
    name: "schema_valid",
    critical: true,
    pass:
      typeof draft.letter_body === "string" &&
      draft.letter_body.length > 20 &&
      typeof draft.root_cause === "string" &&
      Array.isArray(draft.evidence_to_attach),
    detail: "required fields present and typed",
  });

  // 2. Root cause matches ground truth
  checks.push({
    name: "root_cause_correct",
    critical: true,
    pass: draft.root_cause === c.expect.rootCause,
    detail: `got ${draft.root_cause}, expected ${c.expect.rootCause}`,
  });

  // 3. Disputability matches ground truth
  checks.push({
    name: "disputable_correct",
    critical: true,
    pass: draft.disputable === c.expect.disputable,
    detail: `got ${draft.disputable}, expected ${c.expect.disputable}`,
  });

  // 4. Required substrings echoed (PO reference, etc.)
  const missingEcho = c.expect.mustEcho.filter((s) => !haystack.includes(s));
  checks.push({
    name: "echoes_source_facts",
    critical: true,
    pass: missingEcho.length === 0,
    detail: missingEcho.length ? `missing: ${missingEcho.join(", ")}` : "all present",
  });

  // 5. po_reference field matches what was given (no silent invention)
  const expectedRef = c.input.reference || "(none given)";
  checks.push({
    name: "po_reference_grounded",
    critical: true,
    pass:
      c.input.reference === ""
        ? draft.po_reference.trim() === "" || /none/i.test(draft.po_reference)
        : draft.po_reference.includes(c.input.reference),
    detail: `got "${draft.po_reference}", expected ~"${expectedRef}"`,
  });

  // 6. Amount echoed when the row carries one; never fabricated when it doesn't
  if (c.expect.amount != null) {
    const whole = String(Math.round(c.expect.amount));
    const withDecimals = c.expect.amount.toFixed(2);
    checks.push({
      name: "amount_echoed",
      critical: false,
      pass: haystack.includes(whole) || haystack.includes(withDecimals) || draft.disputed_amount_usd === c.expect.amount,
      detail: `looking for ${withDecimals}`,
    });
  } else {
    // No amount provided — the draft must not have invented one > 0.
    checks.push({
      name: "no_fabricated_amount",
      critical: true,
      pass: draft.disputed_amount_usd === 0,
      detail: `disputed_amount_usd=${draft.disputed_amount_usd} (expected 0)`,
    });
  }

  // 7. No invented PO numbers
  if (c.expect.noInventedPo) {
    const tokens = (body.match(PO_TOKEN) ?? []).map((t) => t.replace(/\s/g, "").toUpperCase());
    const allowed = c.input.reference ? c.input.reference.toUpperCase() : null;
    const invented = tokens.filter((t) => t !== allowed);
    checks.push({
      name: "no_invented_po",
      critical: true,
      pass: invented.length === 0,
      detail: invented.length ? `invented: ${[...new Set(invented)].join(", ")}` : "none",
    });
  }

  // 8. No fabricated policy citations (unless the source text used them)
  const sourceText = `${c.input.type} ${c.input.details ?? ""} ${c.input.evidence ?? ""}`;
  const bodyCitations = body.match(FAKE_POLICY) ?? [];
  const inventedCitations = bodyCitations.filter((cit) => !new RegExp(cit.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(sourceText));
  checks.push({
    name: "no_fabricated_policy",
    critical: true,
    pass: inventedCitations.length === 0,
    detail: inventedCitations.length ? `invented: ${inventedCitations.join(", ")}` : "none",
  });

  // 9. Evidence is grounded in this root cause's known evidence set (soft)
  if (c.expect.disputable) {
    checks.push({
      name: "evidence_present",
      critical: false,
      pass: Array.isArray(draft.evidence_to_attach) && draft.evidence_to_attach.length > 0,
      detail: `${draft.evidence_to_attach?.length ?? 0} items; canonical set: ${ROOT_CAUSES[c.expect.rootCause].evidence.length}`,
    });
  }

  return checks;
}

export function deterministicPass(checks: Check[]): boolean {
  return checks.filter((c) => c.critical).every((c) => c.pass);
}

// ---- LLM-as-judge ----

export interface JudgeVerdict {
  persuasiveness: number;
  factual_grounding: number;
  correct_strategy: number;
  tone: number;
  overall_pass: boolean;
  rationale: string;
}

const JUDGE_TOOL = {
  name: "score_dispute",
  description: "Score a drafted chargeback dispute against the rubric.",
  strict: true,
  input_schema: {
    type: "object" as const,
    additionalProperties: false,
    properties: {
      persuasiveness: { type: "integer", enum: [1, 2, 3, 4, 5], description: "Would this argument move an Amazon vendor manager?" },
      factual_grounding: { type: "integer", enum: [1, 2, 3, 4, 5], description: "Uses ONLY the provided facts — no invented PO#s, amounts, dates, or policy codes. 5 = fully grounded, 1 = fabricated facts." },
      correct_strategy: { type: "integer", enum: [1, 2, 3, 4, 5], description: "Right argument for this root cause (e.g. shortage → demand proof of delivery; labeling → acknowledge it's hard to win)." },
      tone: { type: "integer", enum: [1, 2, 3, 4, 5], description: "Professional and paste-ready for Vendor Central." },
      overall_pass: { type: "boolean", description: "Would you send this dispute as-is?" },
      rationale: { type: "string", description: "One or two sentences." },
    },
    required: ["persuasiveness", "factual_grounding", "correct_strategy", "tone", "overall_pass", "rationale"],
  },
};

const JUDGE_MODEL = "claude-opus-4-8";

function isVerdict(x: unknown): x is JudgeVerdict {
  if (typeof x !== "object" || x === null) return false;
  const v = x as Record<string, unknown>;
  return (
    [v.persuasiveness, v.factual_grounding, v.correct_strategy, v.tone].every(
      (s) => typeof s === "number" && Number.isInteger(s) && s >= 1 && s <= 5,
    ) &&
    typeof v.overall_pass === "boolean" &&
    typeof v.rationale === "string"
  );
}

export async function judge(client: Anthropic, c: DisputeCase, draft: DisputeDraft): Promise<JudgeVerdict> {
  const system =
    "You are a strict evaluator of Amazon 1P chargeback disputes. You know Vendor Central deduction disputes cold. Score conservatively: a dispute that invents any fact, or manufactures a winning argument for a non-disputable chargeback, cannot pass no matter how well-written.";

  const user =
    `SOURCE CHARGEBACK (the only facts that are true):\n` +
    `- Type: ${c.input.type}\n` +
    `- PO/reference: ${c.input.reference || "(none given)"}\n` +
    `- ASIN: ${c.input.asin || "(none)"}\n` +
    `- Amount: ${c.input.amount != null ? "$" + c.input.amount.toFixed(2) : "(not given)"}\n` +
    `- Vendor's account: ${c.input.details || "(none)"}\n` +
    `- Evidence on hand: ${c.input.evidence || "(none listed)"}\n\n` +
    `DRAFTED DISPUTE TO SCORE:\n` +
    `- Claimed root cause: ${draft.root_cause}\n` +
    `- Marked disputable: ${draft.disputable}\n` +
    `- Letter body:\n"""${draft.letter_body}"""\n` +
    `- Evidence to attach: ${JSON.stringify(draft.evidence_to_attach)}\n` +
    `- Missing evidence flagged: ${JSON.stringify(draft.missing_evidence)}\n\n` +
    `Score it with the score_dispute tool.`;

  // Strict tool schemas constrain shape, not presence — a verdict can still
  // arrive with null scores, so validate at runtime and retry once.
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await client.messages.create({
      model: JUDGE_MODEL,
      max_tokens: 1024,
      system,
      tools: [JUDGE_TOOL as unknown as Anthropic.Tool],
      tool_choice: { type: "tool", name: JUDGE_TOOL.name },
      messages: [{ role: "user", content: user }],
    });

    const block = res.content.find((b) => b.type === "tool_use");
    if (block && block.type === "tool_use" && isVerdict(block.input)) return block.input;
  }
  throw new Error("Judge did not return a valid verdict after retry.");
}
