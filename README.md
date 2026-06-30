# HENRY — your local fulfillment center

A repository of Amazon knowledge to help 1P vendors and 3P sellers grow. Amazon
publishes label specs, program rules, and policy updates constantly, but most
vendors never read them. HENRY gathers, verifies, and explains it — like a
Customer Success Manager, but digital.

## What it does

**ASIN Toolkit** — paste your ASINs and HENRY pulls, for each one:

- Who's currently winning the **buy box** (Amazon vs. a 3P seller)
- Which ASINs have **no featured offer** (suppressed buy box)
- **Lowest price in the last 30 / 60 days**
- ASINs with a **price variance over ±5%** in the last 30 days

**Ask an Amazonian** — a chat that answers anything a seller needs:

- _"What's the latest FNSKU label requirement?"_
- _"How do I enroll an ASIN in Subscribe & Save?"_
- _"How do I get Climate Pledge Friendly certified?"_
- _"How do I file a chargeback dispute successfully?"_
- _"When is Prime Day this year?"_
- **Scan a label** — upload a photo and HENRY flags what's missing.

It runs on **Claude Opus 4.8** with **web search**, so date- and policy-sensitive
answers are pulled from current published guidance rather than stale memory.

## Stack

Next.js (App Router) + TypeScript. Pricing data via the **Keepa API**; the
assistant via the **Anthropic API**. Both API keys are server-side only.

## Run it

```bash
npm install
cp .env.local.example .env.local   # optional — see below
npm run dev
```

Open http://localhost:3000.

### Keys (both optional for the demo)

HENRY runs out of the box in **demo mode**: the ASIN tools show realistic
generated data and the chat returns a canned intro. Add keys to go live:

| Key                | Powers                          | Get it from                          |
| ------------------ | ------------------------------- | ------------------------------------ |
| `KEEPA_API_KEY`    | ASIN tools (buy box / pricing)  | https://keepa.com/#!api (paid)       |
| `KEEPA_DOMAIN`     | marketplace (1 = .com, default) | —                                    |
| `ANTHROPIC_API_KEY`| Ask Henry chat + label scanning | https://console.anthropic.com        |

Put them in `.env.local` and restart `npm run dev`.

## How the metrics are defined

- **Buy box winner** — the current featured-offer seller. Amazon's own retail
  seller IDs map to "Amazon"; everything else is shown as a 3P seller.
- **No featured offer** — the buy box is currently suppressed (no winning offer).
- **30 / 60-day low** — the lowest buy-box price observed in that window.
- **30-day variance** — `(max − min) / min × 100` over the last 30 days; flagged
  when it exceeds ±5%.

Keepa returns prices in cents and timestamps in "Keepa minutes"; `src/lib/keepa.ts`
handles the conversion and falls back to the NEW / Amazon price series when a
buy-box history isn't available.

## Project layout

```
src/
  app/
    page.tsx              # tabbed shell (Toolkit / Ask)
    api/asins/route.ts    # POST → analyze ASINs
    api/chat/route.ts     # POST → streaming chat (Claude + web search)
  components/
    AsinTools.tsx         # ASIN table, filters, summary chips
    AskHenry.tsx          # streaming chat + label upload
  lib/
    keepa.ts              # Keepa client + demo-data fallback
    types.ts
```

## Notes & next steps

- Seller **names** for 3P buy-box winners need Keepa's seller endpoint (extra
  tokens); the toolkit shows the seller ID today.
- For a production 1P integration, swap Keepa for the Amazon **SP-API** (needs
  Seller/Vendor Central credentials + app approval).
- Good follow-ons: saved ASIN lists, scheduled buy-box alerts, CSV export, and a
  curated knowledge base the chat can cite from.
