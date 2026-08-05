import { createFileRoute } from "@tanstack/react-router";

import type { NexusEvent } from "@/data/events";
import { fetchUsgsEarthquakes } from "@/lib/live-sources/usgs";
import { fetchGdacsEvents } from "@/lib/live-sources/gdacs";
import { fetchReliefWebEvents } from "@/lib/live-sources/reliefweb";

interface SourceStatus {
  name: string;
  ok: boolean;
  count: number;
  error?: string;
}

const SOURCES: { name: string; fetch: () => Promise<NexusEvent[]> }[] = [
  { name: "USGS", fetch: fetchUsgsEarthquakes },
  { name: "GDACS", fetch: fetchGdacsEvents },
  { name: "ReliefWeb", fetch: fetchReliefWebEvents },
];

export const Route = createFileRoute("/api/live-events")({
  server: {
    handlers: {
      GET: async () => {
        const results = await Promise.allSettled(SOURCES.map((s) => s.fetch()));

        const events: NexusEvent[] = [];
        const sources: SourceStatus[] = [];

        results.forEach((result, i) => {
          const name = SOURCES[i]!.name;
          if (result.status === "fulfilled") {
            events.push(...result.value);
            sources.push({ name, ok: true, count: result.value.length });
          } else {
            console.error(`live-events source failed: ${name}`, result.reason);
            sources.push({
              name,
              ok: false,
              count: 0,
              error: result.reason instanceof Error ? result.reason.message : "Unknown error",
            });
          }
        });

        // De-duplicate near-identical events across sources (e.g. the same major
        // earthquake reported by both USGS and GDACS) by proximity + domain.
        const deduped: NexusEvent[] = [];
        for (const event of events) {
          const isDuplicate = deduped.some(
            (existing) =>
              existing.domain === event.domain &&
              Math.abs(existing.lat - event.lat) < 0.5 &&
              Math.abs(existing.lng - event.lng) < 0.5 &&
              Math.abs((existing.timestampMs ?? 0) - (event.timestampMs ?? 0)) < 1000 * 60 * 60,
          );
          if (!isDuplicate) deduped.push(event);
        }

        const anyOk = sources.some((s) => s.ok);

        return Response.json(
          {
            events: deduped.sort((a, b) => ((a.timestampMs ?? 0) < (b.timestampMs ?? 0) ? 1 : -1)),
            sources,
            fetchedAt: new Date().toISOString(),
            error: anyOk ? undefined : "All live sources are currently unavailable.",
          },
          { status: anyOk ? 200 : 502 },
        );
      },
    },
  },
});
