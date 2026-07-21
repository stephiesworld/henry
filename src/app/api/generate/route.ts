import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { BASE_PERSONA, DISPUTE_SYSTEM_SUFFIX, buildChargebackUserMarkdown } from "../../../lib/dispute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MODEL = "claude-opus-4-8";

type Task = "brief" | "chargeback" | "optimize" | "cost-increase" | "decision";

interface GenBody {
  task?: Task;
  input?: Record<string, string>;
}

function buildPrompt(task: Task, input: Record<string, string>): {
  system: string;
  user: string;
  useWebSearch: boolean;
  effort?: "low" | "medium" | "high";
  maxUses?: number;
  model?: string;
} {
  switch (task) {
    case "brief": {
      const today = new Date().toISOString().slice(0, 10);
      return {
        useWebSearch: true,
        // Opus 4.8 pulls live results more reliably here; the bottleneck is web-search
        // round-trips, not model speed, so 3 items / 3 searches is what fits the 60s cap.
        effort: "low",
        maxUses: 2,
        system:
          BASE_PERSONA +
          ` You write HENRY's Weekly Brief: a digest of RECENT, REAL Amazon Seller/Vendor Central updates. Today's date is ${today}. "Recent" means within roughly the last 60 days of today — NOT older changes. You are on a STRICT ~45-second budget — be fast and decisive.`,
        user:
          `Today is ${today}. Run web searches NOW (don't announce them), then write the brief. Try queries like "Amazon FBA fee changes ${today.slice(0, 4)}", "Amazon Seller Central news ${today.slice(0, 4)}", "Amazon Vendor Central policy update ${today.slice(0, 4)}", and "Amazon seller fee announcement".\n\n` +
          "RULES:\n" +
          "- Run 1-2 searches MAX (you're on a tight time budget), then write immediately. Amazon changes fees and policies constantly, so there are always updates — report the 2 most impactful you find. Do NOT bail out.\n" +
          "- The updates you REPORT must come from your live search results (each with a real source URL). You MAY use background knowledge to explain a rule or connect it to an existing one — just never present a remembered older change as if it were new.\n" +
          "- Report the most recent updates your search surfaces — newest first. (It's fine if the freshest item is a few months old.)\n\n" +
          "CRITICAL FORMAT: The first characters of your reply MUST be '## ' — no preamble (no 'I'll search'). Then:\n\n" +
          "## HENRY's Weekly Brief\nFor EACH of 2 items:\n\n### <Short headline>\n**What changed:** one or two sentences.\n**Who it affects:** 1P / 3P / Both.\n**Do this:** the concrete action.\n\n" +
          "End with a **Sources** list of the URLs you used.",
      };
    }
    case "chargeback":
      return {
        useWebSearch: false,
        // Persona + fact-assembly are shared with the structured/eval path in lib/dispute.ts
        // so production and the eval harness exercise one prompt.
        system: BASE_PERSONA + DISPUTE_SYSTEM_SUFFIX,
        user: buildChargebackUserMarkdown({
          type: input.type,
          reference: input.reference,
          marketplace: input.marketplace,
          details: input.details,
          evidence: input.evidence,
        }),
      };
    case "optimize":
      return {
        useWebSearch: false,
        system:
          BASE_PERSONA +
          " You optimize Amazon listings for conversion and search, staying within Amazon's style rules (no promotional claims in titles, no contact info, no prohibited words).",
        user:
          `Optimize this Amazon listing.\n\n` +
          `Product: ${input.product || "(unspecified)"}\n` +
          `Category: ${input.category || "(unspecified)"}\n` +
          `Key features / details: ${input.features || "(none given)"}\n` +
          `Target keywords (optional): ${input.keywords || "(none given)"}\n\n` +
          `Produce:\n## Optimized title\nOne title under ~200 characters, brand-first, keyword-rich, compliant.\n\n## Bullet points\nFive benefit-led bullets (each starts with a bolded benefit phrase).\n\n## A+ content angles\n3–4 module ideas (what each should show/say).\n\n## Backend search terms\nA single space-separated line of high-value terms (no commas, no repeats of words already in the title).\n\n## Compliance notes\nAnything to avoid for this category.`,
      };
    case "cost-increase":
      return {
        useWebSearch: false,
        system:
          BASE_PERSONA +
          " You draft wholesale cost-increase requests for 1P vendors, framed to survive Amazon's auto-rejection and win approval.",
        user:
          `Draft a cost-increase request and justification for a 1P vendor.\n\n` +
          `Product / ASIN: ${input.product || "(unspecified)"}\n` +
          `Current wholesale cost: ${input.current || "(not given)"}\n` +
          `Requested new cost (or %): ${input.requested || "(not given)"}\n` +
          `Reason for increase: ${input.reason || "(not given)"}\n` +
          `Supporting evidence available: ${input.evidence || "(none listed)"}\n\n` +
          `Produce:\n## Justification narrative\nA tight, professional case to submit — reference the specific input-cost drivers, frame it around keeping the item profitable for Amazon (not just the vendor), and cite external/market pricing if relevant.\n\n## Evidence to attach\nA checklist of documentation that strengthens this request, and flag anything important that's missing.\n\n## Strategy & timing\n2–4 tips to avoid auto-rejection (raise external prices first, time to cost-change windows / AVN, escalate via vendor manager) tailored to this case.`,
      };
    case "decision":
      return {
        useWebSearch: false,
        system:
          BASE_PERSONA +
          " You advise vendors on whether a product belongs on 1P (Vendor Central), 3P (Seller Central), or a hybrid model, weighing economics and control.",
        user:
          `Give a 1P-vs-3P recommendation for this situation.\n\n` +
          `Product: ${input.product || "(unspecified)"}\n` +
          `Current model: ${input.current || "(not given)"}\n` +
          `Monthly volume / revenue: ${input.volume || "(not given)"}\n` +
          `Approx. margin / profitability: ${input.margin || "(not given)"}\n` +
          `Main goals or concerns: ${input.goals || "(not given)"}\n\n` +
          `Produce:\n## Recommendation\nA clear call (1P, 3P, or hybrid) in the first line, then the reasoning.\n\n## Why\nWeigh price control, economics (co-op/fees/net PPM), effort, and risk for THIS case.\n\n## Trade-offs to watch\nThe main downsides of the recommended path and how to mitigate them.\n\n## Next steps\n2–4 concrete actions.`,
      };
  }
}

// ---- demo fallbacks (no ANTHROPIC_API_KEY) ----
const DEMO: Record<Task, string> = {
  brief: `_HENRY is running in **demo mode** — add ANTHROPIC_API_KEY in Vercel to pull the real, current brief._

### FBA inbound placement fees
**What changed:** Reminder that inbound placement fees apply unless you split shipments across recommended locations.
**Who it affects:** 3P (FBA).
**Do this:** Compare "minimal" vs "optimized" shipment splits before confirming.

### Updated A+ content image specs
**What changed:** Some module image dimension specs were refreshed.
**Who it affects:** Both.
**Do this:** Re-check any rejected modules against the latest specs.

**Sources:** (live sources appear here once the API key is added.)`,
  chargeback: `_Demo mode — add ANTHROPIC_API_KEY in Vercel for a tailored draft._

## Dispute narrative
Re: PO #______ — We dispute this shortage chargeback. Our records show the full ordered quantity was shipped and received; the attached signed BOL and ASN reconcile to the PO quantity...

## Evidence to attach
- Signed BOL / proof of delivery — proves receipt of full quantity.
- Accurate ASN matching the PO — proves what was shipped.
- (Missing?) Carrier delivery confirmation — add if available.

## Tips & deadline
File within the allowed dispute window; reference the exact PO and chargeback ID; make sure ASN and PO quantities reconcile exactly.`,
  optimize: `_Demo mode — add ANTHROPIC_API_KEY in Vercel for a tailored listing._

## Optimized title
BrandName 32oz Insulated Stainless Steel Water Bottle — Leakproof, Keeps Cold 24h / Hot 12h

## Bullet points
- **All-day temperature control:** double-wall vacuum insulation...
- **Leakproof lid:** ...

## A+ content angles
- Comparison module vs. single-wall bottles.
- Lifestyle module (gym / desk / trail).

## Backend search terms
hydration flask thermos metal reusable bpa free sports gym

## Compliance notes
Avoid unverifiable health claims; no "#1 bestseller" in the title.`,
  "cost-increase": `_Demo mode — add ANTHROPIC_API_KEY in Vercel for a tailored draft._

## Justification narrative
Re: cost update for ASIN ______ — We are requesting a wholesale cost adjustment of __% driven by documented increases in raw-material and freight costs. This keeps the item sustainable to supply while remaining profitable for Amazon at current retail...

## Evidence to attach
- Supplier invoices showing the input-cost increase.
- Tariff / freight documentation, dated.
- (Missing?) Evidence your street/MSRP price rose on other channels.

## Strategy & timing
Raise external prices first; submit during a cost-change window or your AVN; escalate strategic SKUs via your vendor manager rather than the portal bot.`,
  decision: `_Demo mode — add ANTHROPIC_API_KEY in Vercel for a tailored recommendation._

## Recommendation
Hybrid — keep high-volume staples on 1P, move price-sensitive SKUs to 3P.

## Why
1P gives scale but no price control; for MAP-sensitive items 3P protects your margin and brand...

## Trade-offs to watch
Channel conflict on shared ASINs; you take on fulfillment/ads on 3P.

## Next steps
- Pull net PPM by ASIN.
- Flag negative-contribution SKUs for 3P.`,
};

function demoStream(task: Task): Response {
  const encoder = new TextEncoder();
  const text = DEMO[task];
  const stream = new ReadableStream({
    start(controller) {
      const tokens = text.split(/(\s+)/);
      let i = 0;
      const push = () => {
        if (i >= tokens.length) return controller.close();
        controller.enqueue(encoder.encode(tokens[i++]));
        setTimeout(push, 8);
      };
      push();
    },
  });
  return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

export async function POST(req: NextRequest) {
  let body: GenBody;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid request.", { status: 400 });
  }
  const task = body.task;
  const VALID: Task[] = ["brief", "chargeback", "optimize", "cost-increase", "decision"];
  if (!task || !VALID.includes(task)) {
    return new Response("Unknown task.", { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return demoStream(task);
  }

  const { system, user, useWebSearch, effort, maxUses, model } = buildPrompt(task, body.input ?? {});
  const client = new Anthropic();
  const encoder = new TextEncoder();
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: user }];

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for (let turn = 0; turn < 6; turn++) {
          const sdkStream = client.messages.stream({
            model: model ?? MODEL,
            max_tokens: 4096,
            thinking: { type: "adaptive" },
            ...(effort ? { output_config: { effort } } : {}),
            // Cache the system prompt so repeated generations reuse it (~90% cheaper
            // on the cached portion) instead of reprocessing it each call.
            system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
            ...(useWebSearch
              ? {
                  tools: [
                    {
                      type: "web_search_20260209" as const,
                      name: "web_search",
                      ...(maxUses ? { max_uses: maxUses } : {}),
                    },
                  ],
                }
              : {}),
            messages,
          });
          sdkStream.on("text", (d) => controller.enqueue(encoder.encode(d)));
          const final = await sdkStream.finalMessage();
          if (final.stop_reason === "pause_turn") {
            messages.push({ role: "assistant", content: final.content });
            continue;
          }
          break;
        }
      } catch (err) {
        controller.enqueue(encoder.encode(`\n\n_(HENRY hit an error: ${(err as Error).message})_`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
  });
}
