import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText } from "ai";

import { createLovableAiGatewayProvider, NEXUS_MODEL } from "./ai-gateway.server";

/** Model used when falling back to the user's own Gemini API key. */
export const GEMINI_FALLBACK_MODEL = "gemini-3.5-flash";
/** Tried in order if the primary fallback model is retired/unavailable (404). */
export const GEMINI_FALLBACK_MODELS = [GEMINI_FALLBACK_MODEL, "gemini-flash-latest", "gemini-2.5-flash"];
const GEMINI_OPENAI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai";

/**
 * True when the gateway refused the call because the workspace is out of AI credits.
 */
export function isCreditsExhausted(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return (
    message.includes("402") ||
    message.toLowerCase().includes("payment required") ||
    message.toLowerCase().includes("insufficient credit")
  );
}

export function createGeminiProvider(geminiApiKey: string, fetchImpl?: typeof fetch) {
  return createOpenAICompatible({
    name: "gemini",
    baseURL: GEMINI_OPENAI_BASE_URL,
    headers: { Authorization: `Bearer ${geminiApiKey}` },
    ...(fetchImpl ? { fetch: fetchImpl } : {}),
  });
}

export type BriefingResult = {
  text: string;
  provider: "lovable" | "gemini";
};

export type BriefingOptions = {
  system: string;
  prompt: string;
  lovableApiKey?: string | undefined;
  geminiApiKey?: string | undefined;
  runId?: string | undefined;
  /** Injectable for tests. */
  fetchImpl?: typeof fetch;
};

/**
 * Generates a briefing through the Lovable AI Gateway and transparently falls
 * back to the project's own Gemini key when Lovable credits are exhausted (402).
 */
export async function generateBriefing({
  system,
  prompt,
  lovableApiKey,
  geminiApiKey,
  runId,
  fetchImpl,
}: BriefingOptions): Promise<BriefingResult> {
  let primaryError: unknown;

  if (lovableApiKey) {
    try {
      const gateway = createLovableAiGatewayProvider(lovableApiKey, runId, fetchImpl);
      const { text } = await generateText({ model: gateway(NEXUS_MODEL), system, prompt });
      if (text.trim()) return { text, provider: "lovable" };
      primaryError = new Error("Empty briefing from primary provider.");
    } catch (error) {
      primaryError = error;
      if (!isCreditsExhausted(error)) throw error;
    }
  }

  if (geminiApiKey) {
    const gemini = createGeminiProvider(geminiApiKey, fetchImpl);
    const { text } = await generateText({
      model: gemini(GEMINI_FALLBACK_MODEL),
      system,
      prompt,
    });
    if (!text.trim()) throw new Error("Empty briefing from fallback provider.");
    return { text, provider: "gemini" };
  }

  throw primaryError ?? new Error("AI is not configured.");
}
