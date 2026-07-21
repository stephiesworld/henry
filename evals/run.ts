import Anthropic from "@anthropic-ai/sdk";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { draftDispute, type DisputeDraft, type DraftResult } from "../src/lib/dispute";
import { deterministic, deterministicPass, judge, type Check, type JudgeVerdict } from "./graders";
import { CASES, type DisputeCase } from "./cases";

/**
 * Eval runner. For each model variant, drafts a dispute for every case, grades
 * it deterministically + with an LLM judge, and prints a model-tradeoff table.
 *
 *   npm run eval                       # all variants, real API (needs ANTHROPIC_API_KEY)
 *   npm run eval -- --variant sonnet   # one variant
 *   HENRY_EVAL_MOCK=1 npm run eval     # synthetic outputs — proves the pipeline runs, no key/cost
 */

// Sticker pricing, USD per 1M tokens (see the claude-api model table).
const PRICING: Record<string, { in: number; out: number }> = {
  "claude-opus-4-8": { in: 5, out: 25 },
  "claude-sonnet-5": { in: 3, out: 15 }, // $2/$10 intro through 2026-08-31
  "claude-haiku-4-5": { in: 1, out: 5 },
};

const VARIANTS: { key: string; model: string }[] = [
  { key: "opus", model: "claude-opus-4-8" },
  { key: "sonnet", model: "claude-sonnet-5" },
  { key: "haiku", model: "claude-haiku-4-5" },
];

const CONCURRENCY = 4;
const MOCK = process.env.HENRY_EVAL_MOCK === "1";

interface CaseResult {
  caseId: string;
  scenario: string;
  model: string;
  draft: DisputeDraft;
  checks: Check[];
  detPass: boolean;
  verdict: JudgeVerdict;
  latencyMs: number;
  costUsd: number;
  error?: string;
}

// ---- mock helpers (no API) ----
function mockDraft(c: DisputeCase): DraftResult {
  const ref = c.input.reference || "(none given)";
  const amt = c.input.amount ?? 0;
  const body =
    `Re: ${ref} — We dispute this ${c.input.type} deduction. ` +
    (amt ? `The deducted $${amt.toFixed(2)} is not supported. ` : "") +
    `Our records reconcile the shipment to the PO; ${c.input.evidence || "supporting records"} confirm the facts.`;
  return {
    draft: {
      root_cause: c.expect.rootCause,
      disputable: c.expect.disputable,
      po_reference: ref,
      asin: c.input.asin ?? "",
      disputed_amount_usd: amt,
      argument_summary: `The ${c.input.type} deduction is not supported by the receiving record.`,
      letter_body: body,
      evidence_to_attach: c.input.evidence ? [c.input.evidence] : [],
      missing_evidence: c.input.evidence ? [] : ["proof of delivery"],
      filing_note: "File within the dispute window and reference the PO and chargeback ID.",
      confidence: c.expect.disputable ? "high" : "low",
    },
    usage: { input_tokens: 900, output_tokens: 320 },
    latencyMs: 40,
    model: "mock",
  };
}
function mockVerdict(c: DisputeCase): JudgeVerdict {
  return {
    persuasiveness: 4,
    factual_grounding: 5,
    correct_strategy: c.expect.disputable ? 4 : 5,
    tone: 5,
    overall_pass: true,
    rationale: "Mock verdict — grounded and paste-ready.",
  };
}

async function pool<T, R>(items: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

function costOf(model: string, usage: { input_tokens: number; output_tokens: number }): number {
  const p = PRICING[model] ?? { in: 0, out: 0 };
  return (usage.input_tokens / 1e6) * p.in + (usage.output_tokens / 1e6) * p.out;
}

async function runOne(client: Anthropic | null, c: DisputeCase, model: string): Promise<CaseResult> {
  try {
    const result = MOCK || !client ? mockDraft(c) : await draftDispute(client, c.input, model);
    const checks = deterministic(c, result.draft);
    const detPass = deterministicPass(checks);
    const verdict = MOCK || !client ? mockVerdict(c) : await judge(client, c, result.draft);
    return {
      caseId: c.id,
      scenario: c.scenario,
      model,
      draft: result.draft,
      checks,
      detPass,
      verdict,
      latencyMs: result.latencyMs,
      costUsd: MOCK ? 0.004 : costOf(model, result.usage),
    };
  } catch (err) {
    return {
      caseId: c.id,
      scenario: c.scenario,
      model,
      draft: {} as DisputeDraft,
      checks: [],
      detPass: false,
      verdict: { persuasiveness: 0, factual_grounding: 0, correct_strategy: 0, tone: 0, overall_pass: false, rationale: "error" },
      latencyMs: 0,
      costUsd: 0,
      error: (err as Error).message,
    };
  }
}

function pct(n: number, d: number): string {
  return d ? `${Math.round((100 * n) / d)}%` : "—";
}
function median(xs: number[]): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

interface Agg {
  key: string;
  model: string;
  n: number;
  detPassRate: number;
  judgePassRate: number;
  combinedPassRate: number;
  judgeMean: number;
  p50LatencyMs: number;
  avgCost: number;
  errors: number;
}

function aggregate(key: string, model: string, results: CaseResult[]): Agg {
  const ok = results.filter((r) => !r.error);
  const det = ok.filter((r) => r.detPass).length;
  const judgePass = ok.filter((r) => r.verdict.overall_pass).length;
  const combined = ok.filter((r) => r.detPass && r.verdict.overall_pass).length;
  const judgeScores = ok.map(
    (r) => (r.verdict.persuasiveness + r.verdict.factual_grounding + r.verdict.correct_strategy + r.verdict.tone) / 4,
  );
  return {
    key,
    model,
    n: results.length,
    detPassRate: det / (ok.length || 1),
    judgePassRate: judgePass / (ok.length || 1),
    combinedPassRate: combined / (ok.length || 1),
    judgeMean: mean(judgeScores),
    p50LatencyMs: median(ok.map((r) => r.latencyMs)),
    avgCost: mean(ok.map((r) => r.costUsd)),
    errors: results.filter((r) => r.error).length,
  };
}

async function main() {
  const arg = process.argv.indexOf("--variant");
  const only = arg >= 0 ? process.argv[arg + 1] : null;
  const variants = only ? VARIANTS.filter((v) => v.key === only) : VARIANTS;

  const hasKey = !!process.env.ANTHROPIC_API_KEY;
  if (!MOCK && !hasKey) {
    console.error("No ANTHROPIC_API_KEY set. Run real evals with a key, or HENRY_EVAL_MOCK=1 to smoke-test the pipeline.");
    process.exit(1);
  }
  const client = MOCK || !hasKey ? null : new Anthropic();

  console.log(`\nHENRY chargeback-dispute eval — ${CASES.length} cases × ${variants.length} variant(s)${MOCK ? "  [MOCK]" : ""}\n`);

  const aggs: Agg[] = [];
  const allResults: Record<string, CaseResult[]> = {};

  for (const v of variants) {
    process.stdout.write(`Running ${v.key} (${v.model}) … `);
    const results = await pool(CASES, CONCURRENCY, (c) => runOne(client, c, v.model));
    allResults[v.key] = results;
    const agg = aggregate(v.key, v.model, results);
    aggs.push(agg);
    console.log(`det ${pct(agg.detPassRate, 1)}  judge ${pct(agg.judgePassRate, 1)}  combined ${pct(agg.combinedPassRate, 1)}`);
    for (const r of results.filter((x) => x.error)) console.log(`   ! ${r.caseId}: ${r.error}`);
  }

  // Console table
  console.log("\n" + "─".repeat(78));
  console.log(
    ["Variant".padEnd(10), "Determ.".padEnd(9), "Judge".padEnd(8), "Combined".padEnd(10), "Judge/5".padEnd(9), "p50 lat".padEnd(9), "$/dispute"].join(""),
  );
  console.log("─".repeat(78));
  for (const a of aggs) {
    console.log(
      [
        a.key.padEnd(10),
        pct(a.detPassRate, 1).padEnd(9),
        pct(a.judgePassRate, 1).padEnd(8),
        pct(a.combinedPassRate, 1).padEnd(10),
        a.judgeMean.toFixed(2).padEnd(9),
        `${(a.p50LatencyMs / 1000).toFixed(1)}s`.padEnd(9),
        `$${a.avgCost.toFixed(4)}`,
      ].join(""),
    );
  }
  console.log("─".repeat(78) + "\n");

  // Write reports
  const here = dirname(fileURLToPath(import.meta.url));
  writeFileSync(join(here, "results.json"), JSON.stringify({ generatedAtMock: MOCK, aggs, results: allResults }, null, 2));
  writeFileSync(join(here, "RESULTS.md"), renderMarkdown(aggs, allResults, MOCK));
  console.log(`Wrote evals/results.json and evals/RESULTS.md\n`);
}

function renderMarkdown(aggs: Agg[], allResults: Record<string, CaseResult[]>, mock: boolean): string {
  const lines: string[] = [];
  lines.push(`# Chargeback-dispute eval results`);
  lines.push("");
  if (mock) lines.push(`> ⚠️ **Mock run** — synthetic outputs, no model calls. Run \`npm run eval\` with an API key for real numbers.\n`);
  lines.push(`${CASES.length} cases per variant. Deterministic = all critical checks pass. Combined = deterministic **and** judge pass.`);
  lines.push("");
  lines.push(`| Variant | Model | Determ. pass | Judge pass | Combined | Judge (1–5) | p50 latency | $/dispute |`);
  lines.push(`|---|---|---|---|---|---|---|---|`);
  for (const a of aggs) {
    lines.push(
      `| ${a.key} | \`${a.model}\` | ${pct(a.detPassRate, 1)} | ${pct(a.judgePassRate, 1)} | ${pct(a.combinedPassRate, 1)} | ${a.judgeMean.toFixed(2)} | ${(a.p50LatencyMs / 1000).toFixed(1)}s | $${a.avgCost.toFixed(4)} |`,
    );
  }
  lines.push("");
  // Per-case failures for the first variant (usually the production model)
  const primary = aggs[0];
  if (primary) {
    const results = allResults[primary.key];
    const fails = results.filter((r) => r.error || !r.detPass || !r.verdict.overall_pass);
    lines.push(`## Failures & flags — ${primary.key}`);
    lines.push("");
    if (!fails.length) {
      lines.push(`_None — all ${results.length} cases passed._`);
    } else {
      for (const r of fails) {
        const failed = r.checks.filter((c) => !c.pass).map((c) => `${c.name} (${c.detail})`);
        lines.push(`- **${r.caseId}** — ${r.scenario}`);
        if (r.error) lines.push(`  - error: ${r.error}`);
        if (failed.length) lines.push(`  - deterministic: ${failed.join("; ")}`);
        if (!r.verdict.overall_pass && !r.error) lines.push(`  - judge: ${r.verdict.rationale}`);
      }
    }
  }
  lines.push("");
  return lines.join("\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
