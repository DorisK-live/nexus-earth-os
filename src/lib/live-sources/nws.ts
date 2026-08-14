import type { NexusEvent, Severity } from "@/data/events";

// NOAA / National Weather Service active alerts — official, public, no API key.
// Covers severe weather, flood, tsunami and storm warnings for US territories.
const NWS_URL =
  "https://api.weather.gov/alerts/active?status=actual&severity=Extreme,Severe&limit=40";

interface NwsFeature {
  id?: string;
  geometry?: { type?: string; coordinates?: unknown } | null;
  properties?: {
    event?: string;
    headline?: string;
    description?: string;
    areaDesc?: string;
    severity?: string;
    certainty?: string;
    sent?: string;
    effective?: string;
    "@id"?: string;
  };
}

const SEVERITY_MAP: Record<string, Severity> = {
  Extreme: "critical",
  Severe: "high",
  Moderate: "moderate",
  Minor: "watch",
};

/** Average any nested coordinate ring down to a single representative point. */
function centroid(coordinates: unknown): [number, number] | null {
  const points: [number, number][] = [];
  const walk = (node: unknown) => {
    if (!Array.isArray(node)) return;
    if (typeof node[0] === "number" && typeof node[1] === "number") {
      points.push([node[0] as number, node[1] as number]);
      return;
    }
    node.forEach(walk);
  };
  walk(coordinates);
  if (points.length === 0) return null;
  const lng = points.reduce((sum, p) => sum + p[0], 0) / points.length;
  const lat = points.reduce((sum, p) => sum + p[1], 0) / points.length;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return [lat, lng];
}

function domainFor(eventType: string): NexusEvent["domain"] {
  const type = eventType.toLowerCase();
  if (type.includes("tsunami") || type.includes("earthquake") || type.includes("volcano"))
    return "disaster";
  if (type.includes("fire")) return "disaster";
  return "climate";
}

export async function fetchNwsAlerts(): Promise<NexusEvent[]> {
  const response = await fetch(NWS_URL, {
    headers: {
      Accept: "application/geo+json",
      "User-Agent": "NexusEarth/1.0 (planetary intelligence; contact via app)",
    },
  });
  if (!response.ok) throw new Error(`NWS alerts responded ${response.status}`);
  const payload = (await response.json()) as { features?: NwsFeature[] };

  const out: NexusEvent[] = [];
  for (const feature of payload.features ?? []) {
    const props = feature.properties;
    if (!props?.event) continue;
    const point = feature.geometry ? centroid(feature.geometry.coordinates) : null;
    if (!point) continue; // no usable geometry — never guess a location
    const [lat, lng] = point;

    const sent = props.sent ?? props.effective;
    const timestampMs = sent ? Date.parse(sent) : NaN;
    const area = props.areaDesc?.split(";")[0]?.trim() ?? "United States";

    out.push({
      id: `nws-${feature.id ?? `${props.event}-${lat.toFixed(2)}-${lng.toFixed(2)}`}`,
      title: props.event,
      domain: domainFor(props.event),
      severity: SEVERITY_MAP[props.severity ?? ""] ?? "moderate",
      location: area,
      country: "United States",
      lat,
      lng,
      detectedMinutesAgo: Number.isFinite(timestampMs)
        ? Math.max(0, (Date.now() - timestampMs) / 60000)
        : 0,
      source: "NOAA National Weather Service",
      metric: `${props.severity ?? "Severe"} · certainty ${props.certainty ?? "unknown"}`,
      summary: (props.headline ?? props.description ?? props.event).slice(0, 480),
      links: [],
      isLive: true,
      verified: true,
      ...(props["@id"] ? { sourceUrl: props["@id"] } : {}),
      ...(Number.isFinite(timestampMs) ? { timestampMs } : {}),
    });
  }

  return out.sort((a, b) => a.detectedMinutesAgo - b.detectedMinutesAgo).slice(0, 15);
}
