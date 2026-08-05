import type { NexusEvent } from "@/data/events";
import { fetchUsgsEarthquakes } from "@/lib/live-sources/usgs";
import { fetchGdacsEvents } from "@/lib/live-sources/gdacs";
import { fetchReliefWebEvents } from "@/lib/live-sources/reliefweb";
import { fetchWhoOutbreaks } from "@/lib/live-sources/who";
import { fetchCisaAdvisories } from "@/lib/live-sources/cisa";
import { fetchSpaceWeatherAlerts } from "@/lib/live-sources/swpc";
import { fetchCurrencyStress } from "@/lib/live-sources/fx";
import { deriveLaneEvents } from "@/lib/live-sources/derived";

export interface SourceStatus {
  name: string;
  ok: boolean;
  count: number;
  error?: string;
}

export interface LiveFeedSnapshot {
  events: NexusEvent[];
  sources: SourceStatus[];
  fetchedAt: string;
  error?: string;
}

const SOURCES: { name: string; fetch: () => Promise<NexusEvent[]> }[] = [
  { name: "USGS", fetch: fetchUsgsEarthquakes },
  { name: "GDACS", fetch: fetchGdacsEvents },
  { name: "ReliefWeb", fetch: fetchReliefWebEvents },
  { name: "WHO", fetch: fetchWhoOutbreaks },
  { name: "CISA", fetch: fetchCisaAdvisories },
  { name: "NOAA SWPC", fetch: fetchSpaceWeatherAlerts },
  { name: "ECB FX", fetch: fetchCurrencyStress },
];

/** One upstream refresh serves every connected visitor. */
const TTL_MS = 45 * 1000;

let cached: LiveFeedSnapshot | null = null;
let inflight: Promise<LiveFeedSnapshot> | null = null;

function dedupe(events: NexusEvent[]): NexusEvent[] {
  const out: NexusEvent[] = [];
  for (const event of events) {
    const duplicate = out.some(
      (existing) =>
        existing.domain === event.domain &&
        Math.abs(existing.lat - event.lat) < 0.5 &&
        Math.abs(existing.lng - event.lng) < 0.5 &&
        Math.abs((existing.timestampMs ?? 0) - (event.timestampMs ?? 0)) < 1000 * 60 * 60,
    );
    if (!duplicate) out.push(event);
  }
  return out;
}

async function refresh(): Promise<LiveFeedSnapshot> {
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

  const derived = deriveLaneEvents(events);
  if (derived.length > 0) {
    sources.push({ name: "Lane exposure (derived)", ok: true, count: derived.length });
  }

  const anyOk = sources.some((s) => s.ok);
  const snapshot: LiveFeedSnapshot = {
    events: dedupe([...events, ...derived]).sort(
      (a, b) => (b.timestampMs ?? 0) - (a.timestampMs ?? 0),
    ),
    sources,
    fetchedAt: new Date().toISOString(),
    ...(anyOk ? {} : { error: "All live sources are currently unavailable." }),
  };

  cached = snapshot;
  return snapshot;
}

/** Shared, coalesced snapshot: concurrent visitors reuse one upstream fetch. */
export async function getLiveFeed(force = false): Promise<LiveFeedSnapshot> {
  const fresh = cached && Date.now() - Date.parse(cached.fetchedAt) < TTL_MS;
  if (!force && fresh && cached) return cached;
  if (inflight) return inflight;

  inflight = refresh()
    .catch((error) => {
      if (cached) return cached;
      throw error;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

export function peekLiveFeed(): LiveFeedSnapshot | null {
  return cached;
}
