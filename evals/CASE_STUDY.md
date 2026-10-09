# Case study: an eval-driven chargeback dispute agent for Amazon 1P vendors

*How I took one LLM workflow in HENRY from a demo to something I can measure
and protect against regressions.*

---

## 1. The workflow and what it costs today

Amazon 1P vendors (companies that sell wholesale to Amazon through Vendor
Central) get **chargebacks**: automatic deductions for operational mistakes like
ASN/PO quantity mismatches, shipment shortages, carton-content discrepancies,
and FNSKU labeling errors. A mid-size vendor might see dozens a month at
$100–$500 each.

Handling them is manual:

1. Export the deduction report (a messy CSV).
2. Work out the root cause for each row.
3. Decide whether it's worth disputing. Labeling deductions rarely win;
   shortages with proof of delivery usually do.
4. Write a dispute letter that cites the PO, the specific evidence, and the
   argument that fits that root cause.

That takes 15–20 minutes per chargeback for someone who knows Vendor Central,
so the small ones tend to go undisputed and the money is just gone.

**Goal:** turn the export into ready-to-file disputes that cite their evidence,
in seconds. Just as important, I wanted a way to show the drafts are good and
to catch it when a prompt or model change makes them worse.

## 2. Why I built an eval instead of tuning the prompt

The first version (HENRY's Generators tab) already drafted a dispute as
streamed Markdown. It looked fine in a demo. It couldn't answer the question a
customer would ask before trusting it with real money: how often is it right,
and how would we know if a change made it worse?

So the work had three parts:

1. **A contract.** Switch the output from free text to a validated structured
   object so the facts in it can be checked.
2. **An eval harness.** Deterministic checks plus an LLM judge, run over a
   labeled dataset, producing a pass rate and a baseline to compare against.
3. **A model comparison.** Run the eval across model tiers so the
   quality/speed/cost decision is based on numbers.

## 3. System design

### Structured output as the contract

`src/lib/dispute.ts` drafts the dispute with a **forced tool call** that
returns a validated `DisputeDraft`:

```ts
{
  root_cause: "SHORTAGE",          // must match the classified reason
  disputable: true,                // honest about whether it can win
  po_reference: "PO-7820ST",       // must come from the source row, never invented
  disputed_amount_usd: 310.00,
  argument_summary: "...",
  letter_body: "...",              // the paste-ready dispute
  evidence_to_attach: [...],
  missing_evidence: [...],         // what the vendor still needs to gather
  confidence: "high"
}
```

Because `po_reference`, `disputed_amount_usd`, and `root_cause` are separate
fields, they can be graded with plain code. Either they match the source row or
they don't, and you don't need a judge to catch a made-up invoice number.

The persona and the facts block are shared with the production streaming
route, so the eval tests the same prompt the app uses rather than a copy.

### The eval harness

There are two graders.

**Deterministic** (`graders.ts`, no model call). These are cheap and exact:
`schema_valid`, `root_cause_correct`, `disputable_correct`,
`echoes_source_facts`, `po_reference_grounded`, `amount_echoed` /
`no_fabricated_amount`, `no_invented_po`, `no_fabricated_policy`. They're aimed
at the failure judges are worst at catching: a letter that reads well and gets
the facts wrong.

**LLM judge** (Opus 4.8 for every variant). It scores 1–5 on persuasiveness,
whether the strategy fits the root cause, tone, and factual grounding.

A case **passes** only if it clears every critical deterministic check and the
judge says it's ready to send.

### The dataset

17 labeled cases (`cases.ts`) built from HENRY's sample chargeback rows, plus
adversarial cases that test for hallucination:

- **No PO given.** The draft must not make one up (`no_invented_po` with an
  empty allow-list).
- **No amount given.** It must not invent a figure (`no_fabricated_amount`).
- **Labeling and co-op deductions that usually can't be won.** The draft should
  say so plainly instead of building a weak argument (`disputable_correct` plus
  the judge's `correct_strategy` score).

## 4. Results

From the run on 2026-07-21 (`npm run eval` regenerates `RESULTS.md`):

| Variant | Deterministic pass | Judge pass | Combined | Judge (1–5) | p50 latency | $/dispute |
|---|---|---|---|---|---|---|
| Opus 4.8 (production) | 88% | 76% | 71% | 4.49 | 14.9s | $0.0256 |
| Sonnet 5 | 88% | 82% | **76%** | 4.62 | 14.2s | $0.0165 |
| Haiku 4.5 | 82% | 59% | 59% | 4.24 | 7.9s | $0.0047 |

I ran the whole harness in mock mode (`HENRY_EVAL_MOCK=1`) before making any
paid calls, and that turned up one grader bug: the PO-number regex matched the
word "PO" followed by any word. The first real runs found two more problems:

1. **The judge sometimes returned null scores.** One verdict came back with
   every rubric field set to null. A strict tool schema controls the shape of
   the output but doesn't guarantee the fields are filled, and an unchecked
   cast let those nulls turn the averages into `NaN`. The judge and drafter now
   validate their outputs at runtime (`isVerdict`, `isDisputeDraft`), and the
   judge retries once.
2. **The prompt was missing the deducted amount.** All three models returned
   `disputed_amount_usd: 0` on all 15 cases that had an amount. When every model
   fails the same way, it's usually the pipeline. Sure enough, `disputeFacts()`
   was dropping the amount and the ASIN, and the models were correctly refusing
   to guess. A two-line fix to the shared facts block raised grounding scores
   for every variant.

**What the numbers mean.** The deterministic column is the minimum bar: a
dispute with the wrong invoice number should never go out. The judge column
measures quality, and the last two columns are the cost of running it. Based on
this run I'd ship **Sonnet 5**. It matches Opus on the deterministic checks
(88%), does better with the judge (82% vs. 76%), and costs 36% less per
dispute. Haiku is very cheap at $0.005 per dispute, but with a 59% combined
pass rate someone would have to review almost every other draft, which eats
the savings. The judge's notes on failures (in `RESULTS.md`) mostly say the
same thing: the failing drafts aren't making things up, they're ready to send
before the vendor has the evidence that would win the case. The
`missing_evidence` field and a human review step are there for exactly that.

**Impact on the workflow:** a dispute that takes 15–20 minutes by hand is
drafted in seconds, along with a `missing_evidence` list of what to gather
before filing a weak case.

## 5. Tradeoffs

- **Structured output instead of streaming.** I gave up token-by-token
  Markdown in exchange for fields I can grade and put guardrails on. For a
  workflow that moves money, I think that's worth it, and the UI can still
  render the structured draft nicely.
- **Deterministic checks first.** LLM judges are easy to set up but miss
  factual errors. Running exact checks first leaves the judge to score only the
  subjective part.
- **One judge for every variant.** Using the same judge model keeps the
  comparison about the drafting model, not the judge.

## 6. Next steps

- **Use the structured path in the Chargebacks tab** so vendors see the
  evidence checklist and missing-evidence flags in the app. The prompt is
  already shared, so this is mostly UI work.
- **Track real outcomes.** Record which filed disputes Amazon actually
  approves and feed that back into the rubric, so the eval measures whether
  money comes back and not only whether the draft looks good.
- **Add a prompt-variant row** to see whether a tuned Sonnet 5 prompt can match
  Opus quality at a lower cost.
- **Gate CI on the eval.** Fail the build if the combined pass rate drops below
  the committed baseline, so a prompt change can't quietly make things worse.
