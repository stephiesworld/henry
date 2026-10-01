# HENRY, your local fulfillment center

A toolkit for Amazon 1P vendors, and for 3P sellers too.

**Live demo: [henry-ten.vercel.app](https://henry-ten.vercel.app).** It runs on sample data, so you can click around without setting anything up.

Amazon changes its rules, fees, label specs and programs all the time, and most vendors don't have time to keep up. Vendor Central also leaves out the numbers vendors care about most: what each unit actually earns, why chargebacks keep growing, why a SKU suddenly stopped getting ordered. HENRY pulls Amazon's published guidance together, checks it against what's current, does the math, and explains it in plain English. Think of it as the account manager most vendors never get.

---

## What's inside

Most vendors are trying to decide one of three things: how to make 1P profitable, whether to move to 3P, or how to get better terms. The eight tools are built around those decisions.

| Tool | What it does |
| --- | --- |
| **ASIN toolkit** | Paste a list of ASINs to see who has the buy box, which listings have no featured offer, the 30 and 60-day price lows, and any price that moved more than 5%. Exports to CSV. Live data comes from Keepa if you add your own key. |
| **Profitability** | Net PPM for each ASIN: what's left per unit after co-op, freight, chargebacks, returns and ads. Includes a margin waterfall, a flag for high-selling SKUs with thin margins, a what-if simulator, and CSV import and export. |
| **Chargebacks** | Upload the chargeback export from Vendor Central. Each deduction is sorted by cause, repeat problems (the same ASIN, the same weekday) are flagged, and HENRY drafts a dispute letter for the ones worth fighting. |
| **Weekly brief** | A summary of recent Seller and Vendor Central updates, pulled from a live web search each time with the sources linked. It covers what changed, who it affects and what to do about it. |
| **Vendor Q&A** | 112 common 1P and 3P questions sorted by topic. Click one and HENRY answers it. |
| **Playbooks** | Step-by-step guides for things like cost-increase approval, CRAP status, net PPM, 1P vs 3P, AVN prep and FNSKU labels. The chat uses these as its starting point too. |
| **Generators** | First drafts for the writing-heavy jobs: a cost-increase request builder (with a COGS breakdown and an approval-likelihood meter), a 1P vs 3P analysis, a chargeback dispute writer and a listing optimizer. |
| **Ask an Amazonian** | A chat built on Claude with web search and image input. It answers from the playbooks and checks current guidance before replying. Upload a photo of a label and it'll point out what's missing. |

---

## How it's built

- **Next.js (App Router) and TypeScript** for both the UI and the server-side API routes.
- **Claude (Opus 4.8)** through the Anthropic API for the chat, weekly brief and generators. It uses the web search tool and streams its responses. All calls happen on the server, so API keys never reach the browser.
- **Keepa API** for live buy-box and pricing data in the ASIN toolkit. This is optional and uses your own key.
- **Vercel** for hosting and serverless functions.
- **localStorage** for saved lists, P&L data and uploads. There are no accounts yet (see the roadmap below).

The chat and the brief let Claude decide when to search, read the sources and pull an answer together over several steps, because those questions are open-ended. The financial tools (net PPM, chargeback classification, CSV parsing) are plain code instead. Money math should give the same answer every time, and that's not a job for a language model.

---

## Running it locally

```bash
npm install
cp .env.local.example .env.local   # optional, see below
npm run dev                         # http://localhost:3000
```

Without any keys it runs in demo mode, with generated sample data and a canned assistant. To use real data, add these to `.env.local`:

| Key | Used for | Where to get it |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | Chat, weekly brief, generators, label scanning | [console.anthropic.com](https://console.anthropic.com) |
| `KEEPA_API_KEY` | Live buy-box and pricing in the ASIN toolkit | [keepa.com/#!api](https://keepa.com/#!api) |

[DEPLOY.md](DEPLOY.md) covers deploying to Vercel.

---

## Project structure

```
src/
  app/
    page.tsx              # landing page
    app/page.tsx          # the app shell (sidebar + tools)
    api/
      asins/route.ts      # ASIN analysis (Keepa, with demo fallback)
      chat/route.ts       # streaming chat (Claude + web search)
      generate/route.ts   # brief and generators (Claude, streaming)
  components/              # one component per tool
  lib/
    keepa.ts              # Keepa client and demo data
    knowledge.ts          # playbooks
    questions.ts          # the vendor Q&A catalog
    profitability.ts      # net PPM math
    chargebacks.ts        # chargeback classification
```

---

## What's real and what's next

This is a working prototype that I built on my own.

- **Live:** the chat, weekly brief and generators all call Claude with web search.
- **Sample or entered data:** the financial tools run on sample data or numbers you type in or upload. They aren't connected to a live Vendor Central feed yet.

Two buttons in the app are marked "coming soon" and show where it's headed:

- **Connect Vendor Central** would sync POs, sales, net PPM and deductions automatically through Amazon's SP-API. Chargebacks would probably stay as a CSV upload, since the API doesn't expose them well.
- **Accounts** would move saved data out of localStorage and into per-user storage (for example Supabase auth with Postgres) so it follows you between devices.

---

## Data and affiliation

HENRY is an independent project and isn't affiliated with or endorsed by Amazon. The playbooks, the Q&A catalog and the assistant's answers all come from Amazon's publicly published seller and vendor documentation, gathered with Claude and web search. No confidential, internal or proprietary data is used, and the figures in the sample data are made up for illustration.

---

Built by [stephiesworld](https://github.com/stephiesworld). Pricing data from Keepa, answers from Claude with web search.
