import { createFileRoute } from "@tanstack/react-router";

import type { NexusEvent, Severity } from "@/data/events";

// USGS Earthquake Hazards Program — public, free, no API key, updated every 5 minutes.
// M4.5+ over the trailing day keeps the feed to a meaningful, non-noisy set of events.
const USGS_FEED_URL = "https://earthquake.usgs.gov/earthquake/feed/v1.0/summary/4.5_day.geojson";

interface UsgsFeature {
  id: string;
  properties: {
    mag: number | null;
    place: string | null;
    time: number;
    updated: number;
    tsunami: number;
    felt: number | null;
    alert: string | null;
    title: string | null;
  };
  geometry: {
    type: string;
    coordinates: [number, number, number]; // [lng, lat, depthKm]
  };
}

interface UsgsFeed {
  features: UsgsFeature[];
}

function severityForMagnitude(mag: number): Severity {
  if (mag >= 7) return "critical";
  if (mag >= 6) return "high";
  if (mag >= 5) return "moderate";
  return "watch";
}

/** USGS "place" strings look like "82 km SE of Ishigaki, Japan" — split off a country label. */
function splitPlace(place: string): { location: string; country: string } {
  const parts = place.split(",").map((p) => p.trim());
  const last = parts[parts.length - 1];
  if (parts.length >= 2 && last) {
    return { location: parts.slice(0, -1).join(", "), country: last };
  }
  return { location: place, country: "—" };
}

function toNexusEvent(feature: UsgsFeature): NexusEvent | null {
  const { properties: p, geometry } = feature;
  if (!p.mag || !geometry?.coordinates || geometry.coordinates.length < 2) return null;

  const [lng, lat, depth] = geometry.coordinates;
  const place = p.place ?? "Unknown location";
  const { location, country } = splitPlace(place);
  const severity = severityForMagnitude(p.mag);
  const ageMinutes = Math.max(0, (Date.now() - p.time) / 60000);

  return {
    id: `usgs-${feature.id}`,
    title: `M${p.mag.toFixed(1)} earthquake — ${location}`,
    domain: "disaster",
    severity,
    location,
    country,
    lat,
    lng,
    detectedMinutesAgo: ageMinutes,
    source: "USGS Earthquake Hazards Program",
    metric: `M${p.mag.toFixed(1)} · ${depth != null ? `${Math.round(depth)} km depth` : "depth unknown"}`,
    summary: [
      `Magnitude ${p.mag.toFixed(1)} earthquake ${place}.`,
      p.tsunami === 1 ? "A tsunami message has been issued for this event." : null,
      p.felt ? `Reported felt by ${p.felt} people via USGS "Did You Feel It?" reports.` : null,
      p.alert ? `USGS PAGER alert level: ${p.alert}.` : null,
    ]
      .filter(Boolean)
      .join(" "),
    links: [],
    isLive: true,
    timestampMs: p.time,
  };
}

export const Route = createFileRoute("/api/live-events")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const response = await fetch(USGS_FEED_URL, {
            headers: { "User-Agent": "NexusEarth/1.0 (live-events feed)" },
          });
          if (!response.ok) {
            return Response.json(
              { error: `USGS feed responded ${response.status}`, events: [] },
              { status: 502 },
            );
          }
          const feed = (await response.json()) as UsgsFeed;
          const events = feed.features
            .map(toNexusEvent)
            .filter((e): e is NexusEvent => e !== null)
            .sort((a, b) => a.detectedMinutesAgo - b.detectedMinutesAgo)
            .slice(0, 25);

          return Response.json({
            events,
            fetchedAt: new Date().toISOString(),
            source: "USGS Earthquake Hazards Program (earthquake.usgs.gov)",
          });
        } catch (error) {
          console.error("live-events fetch failed", error);
          return Response.json(
            { error: "Could not reach the USGS feed.", events: [] },
            { status: 502 },
          );
        }
      },
    },
  },
});
