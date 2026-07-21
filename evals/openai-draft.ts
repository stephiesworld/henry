import OpenAI from "openai";
import {
  BASE_PERSONA,
  DISPUTE_SYSTEM_SUFFIX,
  DISPUTE_TOOL,
  buildStructuredUser,
  isDisputeDraft,
  type DisputeInput,
  type DraftResult,
} from "../src/lib/dispute";

/**
 * OpenAI drafting path for the cross-vendor rows of the tradeoff table.
 * Same persona, same user prompt, same DisputeDraft contract as the Anthropic
 * path — only the transport differs, so the comparison stays apples-to-apples.
 * The judge remains Opus 4.8 for every variant (see graders.ts).
 */

const OPENAI_TOOL: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: "function",
  function: {
    name: DISPUTE_TOOL.name,
    description: DISPUTE_TOOL.description,
    strict: true,
    parameters: DISPUTE_TOOL.input_schema as unknown as Record<string, unknown>,
  },
};

export async function draftDisputeOpenAI(
  client: OpenAI,
  input: DisputeInput,
  model: string,
): Promise<DraftResult> {
  const start = Date.now();
  const res = await client.chat.completions.create({
    model,
    max_completion_tokens: 2048,
    messages: [
      { role: "system", content: BASE_PERSONA + DISPUTE_SYSTEM_SUFFIX },
      { role: "user", content: buildStructuredUser(input) },
    ],
    tools: [OPENAI_TOOL],
    tool_choice: { type: "function", function: { name: DISPUTE_TOOL.name } },
  });

  const call = res.choices[0]?.message?.tool_calls?.[0];
  if (!call || call.type !== "function") {
    throw new Error("Model did not return the submit_dispute tool call.");
  }
  const parsed: unknown = JSON.parse(call.function.arguments);
  if (!isDisputeDraft(parsed)) {
    throw new Error("submit_dispute output failed runtime validation.");
  }

  return {
    draft: parsed,
    usage: {
      input_tokens: res.usage?.prompt_tokens ?? 0,
      output_tokens: res.usage?.completion_tokens ?? 0,
    },
    latencyMs: Date.now() - start,
    model,
  };
}
