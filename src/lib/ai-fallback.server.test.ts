import { describe, expect, it } from "vitest";

import { generateBriefing, isCreditsExhausted } from "./ai-fallback.server";

const GATEWAY_HOST = "ai.gateway.lovable.dev";
const GEMINI_HOST = "generativelanguage.googleapis.com";

function chatCompletion(content: string) {
  return new Response(
    JSON.stringify({
      id: "cmpl_test",
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: "test-model",
      choices: [{ index: 0, message: { role: "assistant", content }, finish_reason: "stop" }],
      usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

/** Gateway 402 shape returned when the workspace is out of AI credits. */
function creditsExhausted() {
  return new Response(JSON.stringify({ error: { message: "Payment Required", type: "payment_required" } }), {
    status: 402,
    headers: { "Content-Type": "application/json" },
  });
}

function makeFetch(handler: (host: string, url: string) => Response) {
  const calls: string[] = [];
  const fetchImpl = (async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    calls.push(url);
    return handler(new URL(url).host, url);
  }) as typeof fetch;
  return { fetchImpl, calls };
}

const base = { system: "You are NEXUS EARTH.", prompt: "What is the weather in Munich?" };

describe("Ask NEXUS credit fallback", () => {
  it("detects credit-exhaustion errors", () => {
    expect(isCreditsExhausted(new Error("Payment Required"))).toBe(true);
    expect(isCreditsExhausted(new Error("status 402"))).toBe(true);
    expect(isCreditsExhausted(new Error("500 upstream failure"))).toBe(false);
  });

  it("uses the Lovable gateway while credits are available", async () => {
    const { fetchImpl, calls } = makeFetch((host) =>
      host === GATEWAY_HOST ? chatCompletion("Primary briefing.") : creditsExhausted(),
    );

    const result = await generateBriefing({
      ...base,
      lovableApiKey: "lovable-test-key",
      geminiApiKey: "AIza-test-key",
      fetchImpl,
    });

    expect(result.provider).toBe("lovable");
    expect(result.text).toBe("Primary briefing.");
    expect(calls.every((url) => url.includes(GATEWAY_HOST))).toBe(true);
  });

  it("switches to Gemini when the gateway returns 402", async () => {
    const { fetchImpl, calls } = makeFetch((host) =>
      host === GATEWAY_HOST ? creditsExhausted() : chatCompletion("Fallback briefing via Gemini."),
    );

    const result = await generateBriefing({
      ...base,
      lovableApiKey: "lovable-test-key",
      geminiApiKey: "AIza-test-key",
      fetchImpl,
    });

    expect(result.provider).toBe("gemini");
    expect(result.text).toBe("Fallback briefing via Gemini.");
    expect(calls.some((url) => url.includes(GATEWAY_HOST))).toBe(true);
    expect(calls.some((url) => url.includes(GEMINI_HOST))).toBe(true);
  });

  it("surfaces a credit error when no Gemini key is configured", async () => {
    const { fetchImpl } = makeFetch(() => creditsExhausted());

    await expect(
      generateBriefing({ ...base, lovableApiKey: "lovable-test-key", fetchImpl }),
    ).rejects.toSatisfy((error: unknown) => isCreditsExhausted(error));
  });

  it("does not fall back on non-credit failures", async () => {
    const { fetchImpl, calls } = makeFetch(
      () => new Response("boom", { status: 500, headers: { "Content-Type": "text/plain" } }),
    );

    await expect(
      generateBriefing({
        ...base,
        lovableApiKey: "lovable-test-key",
        geminiApiKey: "AIza-test-key",
        fetchImpl,
      }),
    ).rejects.toThrow();
    expect(calls.every((url) => url.includes(GATEWAY_HOST))).toBe(true);
  }, 30000);
});
