import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { generateBriefing, isCreditsExhausted } from "@/lib/ai-fallback.server";
import { getLovableAiGatewayRunId } from "@/lib/ai-gateway.server";

const RequestSchema = z.object({
  question: z.string().min(3).max(600),
  context: z.string().max(4000).optional(),
});

export const NEXUS_SYSTEM_PROMPT = [
  "You are NEXUS EARTH, a planetary risk intelligence system.",
  "Answer as a concise situational briefing for decision-makers.",
  "Structure: one bold-free opening line stating the core judgement, then 3-5 short lines each starting with '- ' describing cascading consequences across different sectors with rough likelihoods, then a final line starting with 'Recommended: ' giving one concrete action.",
  "Under 180 words. No markdown headings, no bold, no preamble, no disclaimers about being an AI.",
  "Never invent casualty numbers or cite specific sources you cannot verify.",
].join(" ");

export const Route = createFileRoute("/api/ask")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        const geminiKey = process.env["GEMINI_API_KEY"];
        if (!apiKey && !geminiKey) {
          return new Response("AI is not configured.", { status: 500 });
        }

        let input: z.infer<typeof RequestSchema>;
        try {
          input = RequestSchema.parse(await request.json());
        } catch {
          return new Response("Invalid request.", { status: 400 });
        }

        try {
          const { text, provider } = await generateBriefing({
            system: NEXUS_SYSTEM_PROMPT,
            prompt: input.context
              ? `Current monitored events:\n${input.context}\n\nQuestion: ${input.question}`
              : input.question,
            lovableApiKey: apiKey,
            geminiApiKey: geminiKey,
            runId: getLovableAiGatewayRunId(request),
          });

          return Response.json({ answer: text, provider });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Briefing failed.";
          const status = message.includes("429") ? 429 : isCreditsExhausted(error) ? 402 : 502;
          console.error("nexus ask error", message);
          return Response.json(
            {
              error:
                status === 429
                  ? "Intelligence queue is saturated. Try again in a moment."
                  : status === 402
                    ? "AI credits are currently unavailable."
                    : "Briefing unavailable right now.",
            },
            { status },
          );
        }
      },
    },
  },
});
