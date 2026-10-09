# HENRY evals — chargeback dispute drafting

An eval harness for one HENRY workflow: drafting 1P vendor chargeback disputes.
It checks whether the model's drafts are actually good and lets you compare
models on quality, latency, and cost before shipping a change.

## Why this workflow

Amazon 1P vendors get hit with chargebacks (ASN mismatches, shortages, labeling
deductions). Disputing each one by hand takes ~15–20 minutes and requires citing
the right evidence for the right root cause, so a lot of small deductions never
get disputed. It's tedious, repetitive, and expensive to get wrong, and the
output is easy to grade: the dispute either cites the correct invoice, ASIN,
amount, and root cause, or it doesn't.

## What it does

1. **Structured output.** `src/lib/dispute.ts` drafts a dispute as a *validated
   JSON object* (`DisputeDraft`) through a forced tool call instead of free text.
   That structure is what makes grading possible.
2. **Two graders** (`graders.ts`):
   - **Deterministic:** exact checks in code. Is the schema valid? Is the root
     cause right? Do the PO reference, ASIN, and amount match the source row?
     Are there any *invented* PO numbers or made-up policy citations? These
     catch what an LLM judge tends to miss, which is facts that sound right
     and aren't.
   - **LLM judge:** a 1–5 rubric for the things code can't score:
     persuasiveness, whether the strategy fits the root cause, tone, and
     factual grounding.
3. **Model comparison table** (`run.ts`). Runs the full dataset across two
   vendors at three tiers each (Opus 4.8 / Sonnet 5 / Haiku 4.5 and GPT-5.6
   Sol / Terra / Luna) and reports pass rates, p50 latency, and cost per
   dispute. Every variant gets the same prompt, the same output schema
   (`openai-draft.ts` reuses both), and the same judge (Opus 4.8), so the rows
   are directly comparable.

## Dataset

`cases.ts` has 17 labeled cases built from the `SAMPLE_CSV` rows in
`src/lib/chargebacks.ts`, plus adversarial cases that test for hallucination:

- A case with **no PO reference**: the model must not invent one.
- A case with **no amount**: the model must not make up a dollar figure.
- **Hard-to-win** labeling and co-op deductions: the model should say plainly
  that they rarely succeed instead of inventing a winning argument.

## Running it

```bash
npm install

# Real run (needs ANTHROPIC_API_KEY). Writes RESULTS.md + results.json.
# Set OPENAI_API_KEY too for the GPT-5.6 rows; without it they're skipped
# (the judge is Anthropic-side, so ANTHROPIC_API_KEY is always required).
npm run eval

# One variant only
npm run eval -- --variant sonnet
npm run eval -- --variant gpt-terra

# Smoke-test the pipeline with synthetic outputs (no key, no cost)
HENRY_EVAL_MOCK=1 npm run eval
```

It prints a table to the console and writes `RESULTS.md` (the table plus
per-case failures) and `results.json` (full per-case detail).

## Design notes

- **Shared prompt.** The persona and fact-assembly (`BASE_PERSONA`,
  `disputeFacts()`) are imported by both the production streaming route
  (`api/generate/route.ts`) and the structured eval path, so the eval grades the
  same prompt the app uses.
- **Same judge for everyone.** Opus 4.8 judges every variant, so differences in
  score come from the drafting model.
- **Critical vs. soft checks.** A deterministic pass requires every *critical*
  check (grounding, correctness). Soft checks like evidence count are reported
  but don't fail a case.

## Extending

- Add cases to `cases.ts` with labeled `expect` fields.
- Add a prompt variant: draft with a tweaked system prompt and add it to
  `VARIANTS` in `run.ts` to see the quality/cost delta.
- Wire `draftDispute()` into the Chargebacks tab to render structured disputes
  (evidence checklist, missing-evidence flags) instead of Markdown.
