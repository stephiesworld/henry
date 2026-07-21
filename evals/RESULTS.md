# Chargeback-dispute eval results

17 cases per variant. Deterministic = all critical checks pass. Combined = deterministic **and** judge pass.

| Variant | Model | Determ. pass | Judge pass | Combined | Judge (1–5) | p50 latency | $/dispute |
|---|---|---|---|---|---|---|---|
| opus | `claude-opus-4-8` | 88% | 76% | 71% | 4.49 | 14.9s | $0.0256 |
| sonnet | `claude-sonnet-5` | 88% | 82% | 76% | 4.62 | 14.2s | $0.0165 |
| haiku | `claude-haiku-4-5` | 82% | 59% | 59% | 4.24 | 7.9s | $0.0047 |

## Failures & flags — opus

- **asn-03** — ASN mismatch, vendor lists no evidence at all
  - deterministic: evidence_present (0 items; canonical set: 4)
  - judge: The letter is well-written and stays close to the source facts, but it asserts as fact ("the transmitted ASN accurately reflected the shipment contents," "ASN was transmitted prior to arrival") things the vendor has zero evidence for — none of the five required documents are on hand. An ASN mismatch is only winnable by producing the actual 856/timestamp and reconciling it against Amazon's discrepancy detail; arguing generic "timing issue" theories with no attachments will be rejected. Correct move is to gather the flagged evidence first (especially Amazon's receiving report showing which field mismatched) rather than send now.
- **label-02** — Incorrect / unscannable barcode
  - judge: Well-grounded and honestly framed — it invents no facts and correctly acknowledges that a "not scannable at FC" scan result is a receiving-side verdict that's very hard to overturn, especially with only a label spec and no verifier report or as-applied label photos. It's the right posture (labeling chargebacks rarely win), but as-is it isn't a compelling reversal case: a spec alone proves intended format, not that the actual printed/applied labels scanned to grade. Hold until the flagged evidence (verifier report, photos, defect detail, quantity math) is obtained.
- **other-01** — Prep-fee non-compliance charge
  - deterministic: root_cause_correct (got LABELING, expected OTHER)
- **adv-noref** — No PO reference provided — the model must not invent one
  - judge: Correct shortage strategy (assert full quantity shipped, offer proof) and well-grounded with no invented facts, but it cannot be filed or won as-is: no PO number exists yet (Vendor Central requires it to submit), and carton weight photos alone are weak proof of receipt — the winning evidence for a shortage is POD/BOL/ASN, which is all still missing. Fix the PO and attach delivery proof before sending.
- **adv-vague** — Vague reason, sparse facts — must stay grounded
  - deterministic: root_cause_correct (got SHORTAGE, expected ASN_MISMATCH)
  - judge: Correct strategy (shortage → prove what was tendered/received) and fully grounded in the provided facts with clean, paste-ready tone. But a packing list is self-generated and weak on its own; Amazon reconciles shortages against receipt at the FC, so this needs the flagged BOL/POD/ASN evidence to actually win — send it only after attaching that proof.
