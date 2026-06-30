import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { PLAYBOOKS, retrievePlaybooks } from "@/lib/knowledge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Web search + reasoning can run long; give the function room (max 60s on Vercel Hobby).
export const maxDuration = 60;

const MODEL = "claude-opus-4-8";

const SYSTEM_PROMPT = `You are HENRY — a seasoned, ex-Amazon Customer Success Manager turned digital advisor. You help Amazon vendors (1P) and sellers (3P) navigate Selling/Vendor Central the way an insider would. Your tagline: "your local fulfillment center."

Who you serve: 1P vendors who rarely read Amazon's published updates, and 3P sellers who need plain-English answers. Amazon publishes policy, label, program, and date information constantly; your job is to gather it, verify it, and explain it simply.

How you answer:
- Be concrete and actionable. Lead with the answer, then the steps.
- When a question depends on current/changeable facts — label requirements, program enrollment steps (SNS, Climate Pledge Friendly, Vine), category approval, chargeback/dispute processes, Prime Day or other event dates, fee changes — USE THE WEB SEARCH TOOL to pull the latest from amazon.com, sellercentral.amazon.com, vendorcentral.amazon.com, or reputable seller resources. Do not answer date- or policy-sensitive questions from memory alone.
- Cite where the rule comes from (e.g. "per Seller Central Help: …") and link when you have a source.
- Give the 1P path and the 3P path separately when they differ.
- If a label or document image is provided, inspect it carefully and list exactly what's present, what's missing, and what would cause a compliance/ingest rejection.
- If something genuinely varies by category, marketplace, or account, say so and tell them where in Central to confirm.
- When you don't know or it's account-specific, point them to the exact team/case-log path rather than guessing.

Tone: warm, direct, confident — like a CSM who's saved this seller's account a dozen times. No fluff.

CRITICAL EXECUTION RULES:
- NEVER end your turn with only a statement that you will search, check, look something up, or "confirm the current state." If a search is needed, run it immediately in this same turn using the web_search tool, then give the answer. A reply that promises to search but contains no answer is a failure.
- Do not write filler preamble like "Let me confirm…", "I'll search…", or "Let me pull that up." Just do it and answer. The user should never have to ask "did you find anything?"
- For anything current or changeable — policies, fees, label specs, program steps, event dates, who to contact, category requirements — search first, then answer. When in doubt, search rather than guessing.

You have a curated PLAYBOOK LIBRARY (below). When a relevant playbook is provided, ground your answer in it and say so ("From HENRY's playbook on X: …"). Treat playbooks as the trusted baseline for process/structure, and use web search to confirm current dates, fees, thresholds, and exact field requirements on top of it.`;

const PLAYBOOK_INDEX = PLAYBOOKS.map((p) => `- ${p.title} (${p.category})`).join("\n");

function buildSystem(latestUserText: string): string {
  const relevant = retrievePlaybooks(latestUserText, 3);
  let s = `${SYSTEM_PROMPT}\n\n=== PLAYBOOK LIBRARY (titles) ===\n${PLAYBOOK_INDEX}`;
  if (relevant.length) {
    s +=
      `\n\n=== RELEVANT PLAYBOOKS (prefer these; confirm specifics via web search) ===\n` +
      relevant.map((p) => `## ${p.title}\n${p.body}`).join("\n\n");
  }
  return s;
}

interface ClientMessage {
  role: "user" | "assistant";
  text: string;
  image?: { media_type: string; data: string };
}

function toAnthropicMessages(messages: ClientMessage[]): Anthropic.MessageParam[] {
  return messages.map((m) => {
    if (m.role === "user" && m.image) {
      return {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: m.image.media_type as
                | "image/jpeg"
                | "image/png"
                | "image/gif"
                | "image/webp",
              data: m.image.data,
            },
          },
          { type: "text", text: m.text || "Please review this label/document." },
        ],
      };
    }
    return { role: m.role, content: m.text };
  });
}

function demoStream(): Response {
  const text =
    "👋 I'm HENRY, your digital Amazonian — but I'm running in **demo mode** right now.\n\n" +
    "To switch me on, add an `ANTHROPIC_API_KEY` to your `.env.local` and restart the dev server. " +
    "Then I can answer things like:\n\n" +
    "• *What's the latest FNSKU label requirement?*\n" +
    "• *How do I enroll an ASIN in Subscribe & Save?*\n" +
    "• *How do I get Climate Pledge Friendly certification?*\n" +
    "• *How do I file a chargeback dispute successfully?*\n" +
    "• *When is Prime Day this year?*\n\n" +
    "You can also upload a photo of a shipping/product label and I'll flag what's missing.\n\n" +
    "The ASIN tools above already work with built-in demo data — try pasting a few ASINs.";

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // chunk it so the UI shows a typing effect even in demo mode
      const words = text.split(" ");
      let i = 0;
      const push = () => {
        if (i >= words.length) {
          controller.close();
          return;
        }
        controller.enqueue(encoder.encode(words[i] + (i < words.length - 1 ? " " : "")));
        i++;
        setTimeout(push, 12);
      };
      push();
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return demoStream();
  }

  let body: { messages?: ClientMessage[] };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid request.", { status: 400 });
  }

  const clientMessages = (body.messages ?? []).filter((m) => m.text || m.image);
  if (!clientMessages.length) {
    return new Response("No messages provided.", { status: 400 });
  }

  const client = new Anthropic();
  const messages = toAnthropicMessages(clientMessages);
  const lastUser = [...clientMessages].reverse().find((m) => m.role === "user");
  const system = buildSystem(lastUser?.text ?? "");
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Loop to handle server-tool (web search) pause_turn continuations.
        for (let turn = 0; turn < 6; turn++) {
          const sdkStream = client.messages.stream({
            model: MODEL,
            max_tokens: 4096,
            thinking: { type: "adaptive" },
            system,
            tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 5 }],
            messages,
          });

          sdkStream.on("text", (delta) => {
            controller.enqueue(encoder.encode(delta));
          });

          const final = await sdkStream.finalMessage();

          if (final.stop_reason === "pause_turn") {
            // Server tool hit its iteration cap — re-send to continue.
            messages.push({ role: "assistant", content: final.content });
            continue;
          }
          break;
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode(`\n\n_(HENRY hit an error: ${(err as Error).message})_`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
