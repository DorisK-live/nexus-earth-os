import { createFileRoute } from "@tanstack/react-router";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";

import {
  createLovableAiGatewayProvider,
  getLovableAiGatewayRunId,
  NEXUS_MODEL,
} from "@/lib/ai-gateway.server";
import {
  createGeminiProvider,
  GEMINI_FALLBACK_MODEL,
  isCreditsExhausted,
} from "@/lib/ai-fallback.server";

const RequestSchema = z.object({
  title: z.string().min(3).max(300),
  domain: z.string().min(2).max(40),
  severity: z.string().min(2).max(20),
  location: z.string().min(1).max(120),
  country: z.string().min(1).max(120),
  metric: z.string().max(120),
  summary: z.string().max(1200),
});

const AnalysisSchema = z.object({
  whyItMatters: z.string(),
  impacts: z.array(
    z.object({
      sector: z.string(),
      headline: z.string(),
      detail: z.string(),
      probability: z.number(),
      confidence: z.number(),
      horizon: z.string(),
    }),
  ),
  timeline: z.array(
    z.object({
      window: z.string(),
      development: z.string(),
    }),
  ),
  actions: z.array(
    z.object({
      audience: z.string(),
      action: z.string(),
    }),
  ),
});

export const Route = createFileRoute("/api/analyze")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        const geminiKey = process.env["GEMINI_API_KEY"];
        if (!apiKey && !geminiKey) {
          return Response.json({ error: "AI is not configured." }, { status: 500 });
        }

        let input: z.infer<typeof RequestSchema>;
        try {
          input = RequestSchema.parse(await request.json());
        } catch {
          return Response.json({ error: "Invalid request." }, { status: 400 });
        }

        const runAnalysis = async () => {
          if (apiKey) {
            const gateway = createLovableAiGatewayProvider(apiKey, getLovableAiGatewayRunId(request));
            try {
              return await generateText({
                model: gateway(NEXUS_MODEL),
                output: Output.object({ schema: AnalysisSchema }),
                prompt,
              });
            } catch (error) {
              if (!geminiKey || !isCreditsExhausted(error)) throw error;
            }
          }
          const gemini = createGeminiProvider(geminiKey!);
          return generateText({
            model: gemini(GEMINI_FALLBACK_MODEL),
            output: Output.object({ schema: AnalysisSchema }),
            prompt,
          });
        };

        const prompt = [
          "Analyse this global event as a planetary risk intelligence system.",
          "",
          `Event: ${input.title}`,
          `Domain: ${input.domain}`,
          `Severity: ${input.severity}`,
          `Location: ${input.location}, ${input.country}`,
          `Key metric: ${input.metric}`,
          `Situation: ${input.summary}`,
          "",
          "Return:",
          "- whyItMatters: 2 to 3 sentences on the second-order significance. No preamble.",
          "- impacts: exactly 5 cascading consequences in DIFFERENT sectors (e.g. logistics, health, energy, finance, food, telecom, labour). Each has sector (1-3 words), headline (max 8 words), detail (1 sentence), probability (integer 0-100), confidence (integer 0-100), horizon (e.g. '0-24h', '1-3 days', '1-2 weeks').",
          "- timeline: exactly 4 entries covering the next 72 hours, window like '0-6h', development is one sentence.",
          "- actions: exactly 4 entries, one each for audience 'Business', 'Government', 'NGO', 'Individual'. action is one specific, concrete sentence.",
          "",
          "Be specific and analytical. Never hedge with 'it depends'. Do not invent casualty figures.",
        ].join("\n");

        try {
          const { output } = await runAnalysis();

          const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
          return Response.json({
            whyItMatters: output.whyItMatters,
            impacts: output.impacts.slice(0, 6).map((i) => ({
              ...i,
              probability: clamp(i.probability),
              confidence: clamp(i.confidence),
            })),
            timeline: output.timeline.slice(0, 5),
            actions: output.actions.slice(0, 4),
          });
        } catch (error) {
          if (NoObjectGeneratedError.isInstance(error)) {
            return Response.json(
              { error: "The analysis came back malformed. Try again." },
              { status: 502 },
            );
          }
          const message = error instanceof Error ? error.message : "Analysis failed.";
          const status = message.includes("429") ? 429 : message.includes("402") ? 402 : 502;
          console.error("nexus analyze error", message);
          return Response.json(
            {
              error:
                status === 429
                  ? "Intelligence queue is saturated. Try again in a moment."
                  : status === 402
                    ? "AI credits exhausted for this workspace."
                    : "Analysis is temporarily unavailable.",
            },
            { status },
          );
        }
      },
    },
  },
});
