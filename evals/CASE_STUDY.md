# Case study: shipping an eval-driven chargeback agent for Amazon 1P vendors

*A worked example of taking one LLM workflow from prototype to a measurable,
regression-guarded production path — the loop an FDE runs with a customer.*

---

## 1. Discovery — the workflow and what it costs today

Amazon 1P vendors (companies that wholesale to Amazon via Vendor Central) get
hit with **chargebacks**: automatic deductions for operational defects —
ASN/PO quantity mismatches, shipment shortages, carton-content discrepancies,
FNSKU labeling errors. A mid-size vendor sees dozens a month, each $100–$500.

Today the workflow is manual:

1. Export the deduction report (an ugly CSV).
2. For each row, figure out the root cause.
3. Decide whether it's even worth disputing (labeling deductions rarely win;
   shortages with proof of delivery usually do).
4. Write a dispute letter that cites the PO, the specific evidence, and the
   right argument for that root-cause type.

That's ~15–20 minutes per chargeback, done by someone who knows Vendor Central.
The result: small deductions go undisputed and quietly become lost margin.

**The target:** turn the export into a set of ready-to-file, evidence-cited
disputes in seconds — and, critically, be able to *prove the drafts are good*
and catch regressions when the prompt or model changes.

## 2. Approach — why an eval, not just a better prompt

The prototype (HENRY's Generators tab) already drafts a dispute as streamed
Markdown. That demos well but can't answer the question a customer actually
asks before they let it touch real money: *how often is it right, and how do we
know it didn't get worse after we changed something?*

So the work here isn't a prettier prompt — it's three things:

1. **A contract.** Convert the output from free text to a validated structured
   object, so facts are gradeable.
2. **An eval harness.** Deterministic checks + an LLM judge over a labeled
   dataset, producing a single pass rate and a regression baseline.
3. **A model tradeoff.** Run the eval across model tiers to make the
   scope/speed/cost call with data, not vibes.

## 3. System design

### Structured output as the contract

`src/lib/dispute.ts` drafts the dispute via a **forced tool call** that returns
a validated `DisputeDraft`:

```ts
{
  root_cause: "SHORTAGE",          // must match the classified reason
  disputable: true,                // honest about winnability
  po_reference: "PO-7820ST",       // must echo the source row — no invention
  disputed_amount_usd: 310.00,
  argument_summary: "...",
  letter_body: "...",              // the paste-ready dispute
  evidence_to_attach: [...],
  missing_evidence: [...],         // what the vendor still needs to gather
  confidence: "high"
}
```

The structured fields (`po_reference`, `disputed_amount_usd`, `root_cause`) are
what make **deterministic grading** possible: they either match the source row
or they don't — no judge required to catch a hallucinated invoice number.

The persona and fact-assembly are shared with the production streaming route, so
the eval exercises the same prompt the app ships — not a parallel copy.

### The eval harness

Two graders, combined:

**Deterministic** (`graders.ts`, no model call) — the cheap, exact layer:
`schema_valid`, `root_cause_correct`, `disputable_correct`,
`echoes_source_facts`, `po_reference_grounded`, `amount_echoed` /
`no_fabricated_amount`, `no_invented_po`, `no_fabricated_policy`. These target
the failure mode judges are worst at: confident, well-written, factually wrong.

**LLM-as-judge** (Opus 4.8, held constant across variants) — a 1–5 rubric for
persuasiveness, correct strategy per root cause, tone, and factual grounding.

A case **passes** only if it clears every critical deterministic check *and* the
judge would send it.

### The dataset

17 labeled cases (`cases.ts`) built from HENRY's real sample chargeback rows,
plus adversarial cases that specifically probe hallucination:

- **No PO given** → the draft must not invent one (`no_invented_po` with an
  empty allow-list).
- **No amount given** → must not fabricate a figure (`no_fabricated_amount`).
- **Non-disputable labeling / co-op deductions** → the draft must be honest that
  it's hard to win, not manufacture a bogus argument (`disputable_correct` +
  judge's `correct_strategy`).

## 4. Results

Real run, 2026-07-21 (`npm run eval` regenerates `RESULTS.md`; the numbers
below are that run):

| Variant | Deterministic pass | Judge pass | Combined | Judge (1–5) | p50 latency | $/dispute |
|---|---|---|---|---|---|---|
| Opus 4.8 (production) | 88% | 76% | 71% | 4.49 | 14.9s | $0.0256 |
| Sonnet 5 | 88% | 82% | **76%** | 4.62 | 14.2s | $0.0165 |
| Haiku 4.5 | 82% | 59% | 59% | 4.24 | 7.9s | $0.0047 |

> The harness was validated end-to-end in mock mode (`HENRY_EVAL_MOCK=1`)
> before spending a cent — and building it caught one grader bug (a PO-number
> regex that matched the plain word "PO" followed by any word). The first
> *real* runs then caught two more bugs, which is the whole argument for evals:
>
> 1. **The judge could return null scores.** One verdict came back with every
>    rubric field null — the strict tool schema constrains shape, not presence —
>    and the unchecked cast let it poison the aggregate into `NaN`. The judge
>    and drafter now runtime-validate their tool outputs (`isVerdict`,
>    `isDisputeDraft`) and the judge retries once.
> 2. **The prompt never included the deducted amount.** All three models
>    returned `disputed_amount_usd: 0` on all 15 amount-bearing cases — a
>    universal failure that had to be a pipeline bug, not a model one.
>    `disputeFacts()` was dropping the amount (and ASIN) on the floor; the
>    models were *correctly* refusing to invent a figure. One two-line fix to
>    the shared facts block lifted every variant's grounding scores.

**How to read it in an FDE conversation:** the deterministic column is the
non-negotiable floor (never file a dispute with a wrong invoice number); the
judge column is quality; the last two columns are the deployment tradeoff. The
data says ship **Sonnet 5**: it holds the same 88% deterministic floor as
Opus, wins on judge pass (82% vs 76%), and costs 36% less per dispute. Haiku's
$0.005/dispute is tempting for a high-volume queue, but a 59% combined rate
means a human reviews nearly every other draft — the savings are false. The
judge's failure rationales (see `RESULTS.md`) are consistent and honest: most
failing drafts aren't hallucinating, they're *sending without the case-winning
evidence attached* — which is exactly what the `missing_evidence` field and a
human-in-the-loop review step are for.

**Workflow impact:** a dispute that takes ~15–20 minutes by hand is drafted in
seconds, and the vendor gets a `missing_evidence` list telling them exactly what
to gather to strengthen a weak case.

## 5. Tradeoffs made

- **Structured over streamed.** Structured output loses the nice token-by-token
  Markdown stream in exchange for gradeable, guardrail-able fields. For a
  money-touching workflow that's the right trade; the UI can render the
  structured draft just as richly.
- **Deterministic-first grading.** LLM judges are seductive but miss factual
  errors. Putting exact checks first means the judge only arbitrates the
  subjective 20%.
- **Consistent judge model.** Judging every variant with the same model isolates
  the drafting model's quality from the judge's.

## 6. What I'd do next

- **Wire the structured path into the Chargebacks tab** so vendors get the
  evidence checklist + missing-evidence flags inline (the prompt is already
  shared; it's a rendering change).
- **Close the loop with outcomes** — capture which filed disputes actually get
  approved and feed real win/loss back into the rubric, moving from "is the
  draft good?" to "does it get the money back?"
- **Add a prompt-variant row** to the tradeoff table to show a tuned Sonnet 5
  prompt matching Opus quality at lower cost — the exact scope/speed/quality
  call this role makes.
- **Regression gate in CI** — fail the build if the combined pass rate drops
  below the committed baseline, so a prompt tweak can't silently regress.
