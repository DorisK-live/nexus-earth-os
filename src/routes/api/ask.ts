import { createFileRoute } from "@tanstack/react-router";
import { streamText } from "ai";
import { z } from "zod";

import {
  createLovableAiGatewayProvider,
  getLovableAiGatewayRunId,
  NEXUS_MODEL,
} from "@/lib/ai-gateway.server";

const RequestSchema = z.object({
  question: z.string().min(3).max(600),
  context: z.string().max(4000).optional(),
});

export const Route = createFileRoute("/api/ask")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) {
          return new Response("AI is not configured.", { status: 500 });
        }

        let input: z.infer<typeof RequestSchema>;
        try {
          input = RequestSchema.parse(await request.json());
        } catch {
          return new Response("Invalid request.", { status: 400 });
        }

        const gateway = createLovableAiGatewayProvider(apiKey, getLovableAiGatewayRunId(request));

        try {
          const result = streamText({
            model: gateway(NEXUS_MODEL),
            system: [
              "You are NEXUS EARTH, a planetary risk intelligence system.",
              "Answer as a concise situational briefing for decision-makers.",
              "Structure: one bold-free opening line stating the core judgement, then 3-5 short lines each starting with '- ' describing cascading consequences across different sectors with rough likelihoods, then a final line starting with 'Recommended: ' giving one concrete action.",
              "Under 180 words. No markdown headings, no bold, no preamble, no disclaimers about being an AI.",
              "Never invent casualty numbers or cite specific sources you cannot verify.",
            ].join(" "),
            prompt: input.context
              ? `Current monitored events:\n${input.context}\n\nQuestion: ${input.question}`
              : input.question,
          });

          return result.toTextStreamResponse();
        } catch (error) {
          console.error("nexus ask error", error);
          return new Response("Intelligence stream unavailable.", { status: 502 });
        }
      },
    },
  },
});
