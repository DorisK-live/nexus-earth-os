import type { NexusEvent, Severity } from "@/data/events";
import { distanceKm, MAJOR_HUBS, MAJOR_PORTS, type Place } from "./geo";

/**
 * Transport and supply-chain signals are derived from the live hazard feeds:
 * when a live disaster/climate event lands close to a major port or passenger
 * hub, that is a real, current threat to a lane — not an illustrative scenario.
 */
const PORT_RADIUS_KM = 500;
const HUB_RADIUS_KM = 350;

function severityFor(distanceFromPlace: number, radius: number, hazard: Severity): Severity {
  const proximity = 1 - distanceFromPlace / radius;
  if (hazard === "critical") return proximity > 0.5 ? "critical" : "high";
  if (hazard === "high") return proximity > 0.5 ? "high" : "moderate";
  return proximity > 0.6 ? "moderate" : "watch";
}

function build(
  hazards: NexusEvent[],
  places: Place[],
  radius: number,
  domain: "supply" | "transport",
  noun: string,
): NexusEvent[] {
  const out: NexusEvent[] = [];
  const seen = new Set<string>();

  for (const place of places) {
    const nearby = hazards
      .map((hazard) => ({
        hazard,
        km: distanceKm(place.lat, place.lng, hazard.lat, hazard.lng),
      }))
      .filter(({ km }) => km <= radius)
      .sort((a, b) => a.km - b.km);

    const closest = nearby[0];
    if (!closest) continue;
    const key = `${domain}-${place.name}`;
    if (seen.has(key)) continue;
    seen.add(key);

    out.push({
      id: key,
      title: `${noun} exposure at ${place.name}`,
      domain,
      severity: severityFor(closest.km, radius, closest.hazard.severity),
      location: place.name,
      country: place.country,
      lat: place.lat,
      lng: place.lng,
      detectedMinutesAgo: closest.hazard.detectedMinutesAgo,
      source: `Derived from live hazard feeds (${closest.hazard.source})`,
      metric: `${Math.round(closest.km)} km from active hazard · ${nearby.length} live signal${nearby.length === 1 ? "" : "s"} in range`,
      summary: `${closest.hazard.title} is currently active ${Math.round(closest.km)} km from ${place.name}, placing ${domain === "supply" ? "cargo throughput and vessel scheduling" : "flight operations and ground access"} at risk. Derived in real time from the live hazard feed, not a scenario.`,
      links: [
        {
          label: closest.hazard.location,
          lat: closest.hazard.lat,
          lng: closest.hazard.lng,
        },
      ],
      isLive: true,
      ...(closest.hazard.timestampMs ? { timestampMs: closest.hazard.timestampMs } : {}),
    });
  }

  return out.slice(0, 8);
}

export function deriveLaneEvents(hazards: NexusEvent[]): NexusEvent[] {
  const relevant = hazards.filter(
    (e) => e.domain === "disaster" || e.domain === "climate" || e.domain === "humanitarian",
  );
  if (relevant.length === 0) return [];
  return [
    ...build(relevant, MAJOR_PORTS, PORT_RADIUS_KM, "supply", "Supply lane"),
    ...build(relevant, MAJOR_HUBS, HUB_RADIUS_KM, "transport", "Transport"),
  ];
}
