import type { NexusEvent, Severity } from "@/data/events";

// NOAA Space Weather Prediction Center — public alerts feed, no API key.
// Geomagnetic storms are an infrastructure signal: power grids, satellites, GNSS, HF radio.
const SWPC_ALERTS = "https://services.swpc.noaa.gov/products/alerts.json";

// Space weather hits high-magnetic-latitude infrastructure hardest.
const IMPACT_ZONES: { name: string; country: string; lat: number; lng: number }[] = [
  { name: "North American grid (high latitude)", country: "Canada", lat: 58.0, lng: -100.0 },
  { name: "Nordic grid & GNSS corridor", country: "Norway", lat: 67.5, lng: 20.0 },
  { name: "Siberian grid corridor", country: "Russia", lat: 64.0, lng: 100.0 },
];

interface SwpcAlert {
  product_id?: string;
  issue_datetime?: string;
  message?: string;
}

function severityFor(message: string): Severity {
  if (/\b(G[45]|S[34]|R[34]|X\d)\b/.test(message)) return "critical";
  if (/\b(G3|S2|R2)\b/.test(message)) return "high";
  if (/\b(G2|G1|S1|R1)\b/.test(message)) return "moderate";
  return "watch";
}

function headline(message: string): string {
  const line = message
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => /^(ALERT|WARNING|WATCH|SUMMARY|EXTENDED WARNING|CANCEL)/i.test(l));
  return (line ?? message.split(/\r?\n/)[0] ?? "Space weather alert").slice(0, 140);
}

export async function fetchSpaceWeatherAlerts(): Promise<NexusEvent[]> {
  const response = await fetch(SWPC_ALERTS, {
    headers: { "User-Agent": "NexusEarth/1.0 (live-events feed)" },
  });
  if (!response.ok) throw new Error(`NOAA SWPC responded ${response.status}`);
  const alerts = (await response.json()) as SwpcAlert[];

  const cutoff = Date.now() - 1000 * 60 * 60 * 48;
  const recent = alerts
    .map((alert) => {
      const ms = alert.issue_datetime ? Date.parse(`${alert.issue_datetime}Z`) : NaN;
      return { alert, ms };
    })
    .filter(({ alert, ms }) => Boolean(alert.message) && Number.isFinite(ms) && ms >= cutoff)
    .sort((a, b) => b.ms - a.ms)
    .slice(0, 3);

  return recent.flatMap(({ alert, ms }, index) => {
    const message = alert.message ?? "";
    const zone = IMPACT_ZONES[index % IMPACT_ZONES.length]!;
    return [
      {
        id: `swpc-${alert.product_id ?? index}-${ms}`,
        title: headline(message),
        domain: "infrastructure",
        severity: severityFor(message),
        location: zone.name,
        country: zone.country,
        lat: zone.lat,
        lng: zone.lng,
        detectedMinutesAgo: Math.max(0, (Date.now() - ms) / 60000),
        source: "NOAA Space Weather Prediction Center",
        metric: alert.product_id ?? "SWPC alert",
        summary: message.replace(/\r?\n/g, " ").replace(/\s+/g, " ").slice(0, 400),
        links: [],
        isLive: true,
        verified: true,
        sourceUrl: "https://www.swpc.noaa.gov/products/alerts-watches-and-warnings",
        timestampMs: ms,
      } satisfies NexusEvent,
    ];
  });
}
