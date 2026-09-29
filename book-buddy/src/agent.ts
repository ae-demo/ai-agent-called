// The AI SDK loop. model.provider in agent.afm.md's front matter is
// "anthropic"; per the skill, when the document names a provider it is
// mapped to that provider's SDK package — anthropic -> @ai-sdk/anthropic.
import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText, stepCountIs, type ModelMessage } from "ai";
import { config } from "./config.js";
import { SYSTEM_PROMPT } from "./prompt.js";
import { tools } from "./tools.js";
import { tracer } from "./tracing.js";

// max_iterations from agent.afm.md's front matter.
const MAX_ITERATIONS = 12;

function buildModel() {
  const baseURL = config.modelEndpoint;
  const apiKey = config.modelApiKey;
  const keyHeader = config.modelApiKeyHeader; // normally unset

  const anthropic = createAnthropic(
    keyHeader
      ? { baseURL, apiKey: "unused", headers: { [keyHeader]: apiKey ?? "" } }
      : { baseURL, apiKey },
  );
  return anthropic(config.modelName ?? "claude-sonnet-5");
}

export interface TurnResult {
  text: string;
  toolCalls: unknown[];
  messages: ModelMessage[];
}

export async function runTurn(history: ModelMessage[]): Promise<TurnResult> {
  const model = buildModel();
  const modelLabel = config.modelName ?? "claude-sonnet-5";

  return tracer.startActiveSpan(`chat ${modelLabel}`, async (span) => {
    try {
      const result = await generateText({
        model,
        system: SYSTEM_PROMPT,
        messages: history,
        tools,
        stopWhen: stepCountIs(MAX_ITERATIONS),
      });
      span.setAttributes({
        "gen_ai.system": "anthropic",
        "gen_ai.request.model": modelLabel,
        "gen_ai.usage.input_tokens": result.usage?.inputTokens ?? 0,
        "gen_ai.usage.output_tokens": result.usage?.outputTokens ?? 0,
      });
      return {
        text: result.text,
        toolCalls: result.toolCalls,
        messages: result.steps.flatMap((s) => s.response.messages),
      };
    } catch (err) {
      span.recordException(err as Error);
      span.setStatus({ code: 2 }); // ERROR
      throw err;
    } finally {
      span.end();
    }
  });
}
