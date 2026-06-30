# HENRY — your local fulfillment center

**A Vendor Central co-pilot for Amazon 1P vendors (and 3P sellers).**

🔗 **Live demo: [henry-ten.vercel.app](https://henry-ten.vercel.app)** — runs on built-in demo data, so you can click straight in (no setup).

Amazon publishes its rules, fee changes, label specs, and program updates constantly — but most vendors never read them, and Vendor Central hides the numbers that matter (true per-unit margin, why chargebacks are eating 3%+, why a SKU stopped getting ordered). HENRY gathers Amazon's guidance, checks it, runs the math, and hands it back in plain English. Like a Customer Success Manager, but digital.

---

## What it does

HENRY is organized around the vendor's real decision tree: **fix profitability while staying 1P → or move to 3P → or negotiate better terms.** Eight tools:

| Tool | What it does |
| --- | --- |
| **ASIN Toolkit** | Paste your ASINs → buy-box winner, no-featured-offer flags, 30/60-day price lows, and ±5% variance alerts. CSV export. Data via Keepa (bring-your-own-key). |
| **Profitability — net PPM by ASIN** | The number Vendor Central hides: true net profit per unit after co-op, freight, chargebacks, returns, and ads. Margin waterfall, "Fool's Gold" detection, a **what-if simulator**, and CSV import/export. |
| **Chargeback forensics** | Upload a Vendor Central chargeback export → auto-classifies every deduction by root cause, flags patterns (recurring ASINs, weekday clusters), shows what's disputable, and **drafts the dispute letter**. |
| **Weekly Brief** | A live, web-searched digest of the most recent Amazon Seller/Vendor Central updates — what changed, who it affects, what to do — with source links. Never recited from memory. |
| **Vendor Q&A** | 120+ real 1P/3P questions organized by topic; tap any one and HENRY answers it for your account. |
| **Playbooks** | A curated library of Amazon how-tos (cost-increase approval, CRAP status, net PPM, 1P-vs-3P, AVN prep, FNSKU labels, and more) that also ground the chat. |
| **Generators** | AI tools for the writing-heavy tasks: a **cost-increase request builder** (COGS breakdown + likelihood-to-approve meter), 1P-vs-3P decision analyzer, chargeback dispute writer, and listing optimizer. |
| **Ask an Amazonian** | An agentic chat (Claude + web search + vision) that answers anything, grounded in the playbooks and checked against current guidance. Upload a label photo and it flags what's missing. |

---

## Architecture & tech

- **Next.js (App Router) + TypeScript** — one codebase for the UI and the server-side API routes.
- **Claude (Opus 4.8)** via the Anthropic API — powers the chat, weekly brief, and generators, with **tool use (web search)** and streaming responses. Server-side only, so keys are never exposed to the browser.
- **Keepa API** — live buy-box / pricing for the ASIN toolkit (optional, bring-your-own-key).
- **Vercel** — hosting + serverless functions.
- **localStorage** — client-side persistence for saved lists, P&L, and uploads (no accounts yet — see roadmap).

**Agentic vs. deterministic, on purpose:** the assistant and brief use Claude's agentic tool-calling (it decides to search, reads sources, and synthesizes across steps) — that's where open-ended reasoning adds value. The financial tools (net PPM, chargeback classification, CSV parsing) are deterministic code, because there you want correctness and repeatability, not an LLM guessing. The technique is matched to the problem.

---

## Run it locally

```bash
npm install
cp .env.local.example .env.local   # optional — see below
npm run dev                         # http://localhost:3000
```

It runs in **demo mode** with no keys (realistic generated data + a canned assistant). To go live, add to `.env.local`:

| Key | Powers | Get it from |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | Chat, weekly brief, generators, label scanning | [console.anthropic.com](https://console.anthropic.com) |
| `KEEPA_API_KEY` | Live buy-box / pricing in the ASIN toolkit | [keepa.com/#!api](https://keepa.com/#!api) |

See [DEPLOY.md](DEPLOY.md) for deploying to Vercel.

---

## Project structure

```
src/
  app/
    page.tsx              # marketing landing page
    app/page.tsx          # the app shell (sidebar + tools)
    api/
      asins/route.ts      # ASIN analysis (Keepa + demo fallback)
      chat/route.ts       # streaming chat (Claude + web search)
      generate/route.ts   # brief / generators (Claude, streaming)
  components/              # one component per tool
  lib/
    keepa.ts              # Keepa client + demo data
    knowledge.ts          # curated playbooks
    questions.ts          # the vendor Q&A catalog
    profitability.ts      # net-PPM math
    chargebacks.ts        # chargeback classification engine
```

---

## Scope & roadmap (honest)

This is a working **prototype**, built solo. What's real vs. not:

- ✅ **Live:** the chat, weekly brief, and generators (Claude + web search).
- 🟡 **Demo / entered data:** the financial tools run on sample data or numbers you enter/upload — not yet a live Vendor Central feed.

Two clearly-marked "coming soon" affordances in the app point at the production vision:

- **Connect Vendor Central** — a real version would sync POs, sales, net PPM, and deductions automatically via Amazon's **SP-API** (chargebacks would stay CSV, since Amazon doesn't expose them well via API).
- **Accounts** — saved data across devices would move from localStorage to per-user storage (e.g. Supabase auth + Postgres).

---

Built by [stephiesworld](https://github.com/stephiesworld). Pricing via Keepa; answers via Claude + web search.
