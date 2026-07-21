# HENRY evals — chargeback dispute drafting

An eval harness for one HENRY workflow: drafting 1P vendor chargeback disputes.
It measures whether the model's output is **good**, systematically, and lets you
compare models on quality vs. latency vs. cost before shipping a change.

## Why this workflow

Amazon 1P vendors get hit with chargebacks (ASN mismatches, shortages, labeling
deductions). Disputing each one by hand takes ~15–20 minutes and requires citing
the right evidence for the right root cause — so many small deductions go
undisputed and become lost margin. It's a painful, repetitive, high-$ task with
an output you can actually grade: the dispute either cites the correct invoice /
ASIN / amount / root cause, or it doesn't.

## What it does

1. **Structured output.** `src/lib/dispute.ts` drafts a dispute as a *validated
   JSON object* (`DisputeDraft`) via a forced tool call — not free text. That
   contract is what makes grading possible.
2. **Two graders** (`graders.ts`):
   - **Deterministic** — programmatic, exact. Schema valid? Root cause correct?
     PO reference / ASIN / amount echoed from the source row? Any *invented* PO
     numbers or fabricated policy citations? This catches the failure mode an
     LLM judge misses: confidently wrong facts.
   - **LLM-as-judge** — a 1–5 rubric for what code can't score: persuasiveness,
     correct strategy for the root cause, professional tone, factual grounding.
3. **Model tradeoff table** (`run.ts`) — runs the whole dataset across two
   vendors, tier for tier — Opus 4.8 / Sonnet 5 / Haiku 4.5 and GPT-5.6
   Sol / Terra / Luna — and reports pass rates, p50 latency, and $/dispute.
   Every variant is judged by the same model (Opus 4.8) over the same prompt
   and output contract (`openai-draft.ts` reuses both), so rows are
   apples-to-apples.

## Dataset

`cases.ts` — 17 labeled cases derived from the real `SAMPLE_CSV` rows in
`src/lib/chargebacks.ts`, plus adversarial cases that probe hallucination:

- A case with **no PO reference** → the model must not invent one.
- A case with **no amount** → the model must not fabricate a dollar figure.
- **Non-disputable** labeling / co-op deductions → the model must be honest that
  it's hard to win, not manufacture a bogus winning argument.

## Running it

```bash
npm install

# Real run (needs ANTHROPIC_API_KEY) — writes RESULTS.md + results.json.
# Set OPENAI_API_KEY too for the GPT-5.6 rows; without it they're skipped
# (the judge is Anthropic-side, so ANTHROPIC_API_KEY is always required).
npm run eval

# One variant only
npm run eval -- --variant sonnet
npm run eval -- --variant gpt-terra

# Smoke-test the pipeline with synthetic outputs (no key, no cost)
HENRY_EVAL_MOCK=1 npm run eval
```

Output: a console table, `RESULTS.md` (table + per-case failures), and
`results.json` (full per-case detail).

## Design notes

- **Shared prompt.** The persona and fact-assembly (`BASE_PERSONA`,
  `disputeFacts()`) are imported by both the production streaming route
  (`api/generate/route.ts`) and the structured/eval path, so the eval grades the
  same prompt the app ships.
- **Consistent judge.** All variants are judged by Opus 4.8 so the score
  reflects the *drafting* model, not the judge.
- **Critical vs. soft checks.** Deterministic "pass" requires every *critical*
  check (grounding, correctness). Soft checks (e.g. evidence count) are reported
  but don't fail a case.

## Extending

- Add cases to `cases.ts` with labeled `expect` fields.
- Add a prompt variant: draft with a tweaked system prompt and add it to
  `VARIANTS` in `run.ts` to see the quality/cost delta.
- Wire `draftDispute()` into the Chargebacks tab to render structured disputes
  (evidence checklist, missing-evidence flags) instead of Markdown.
