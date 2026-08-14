import type { NexusEvent, Severity } from "@/data/events";

// Open-Meteo Air Quality API — public, free, no key required. We sample a fixed set of
// dense urban areas and only surface a signal when pollution is actually unhealthy.
interface City {
  name: string;
  country: string;
  lat: number;
  lng: number;
}

const CITIES: City[] = [
  { name: "Delhi", country: "India", lat: 28.61, lng: 77.21 },
  { name: "Lahore", country: "Pakistan", lat: 31.55, lng: 74.34 },
  { name: "Dhaka", country: "Bangladesh", lat: 23.81, lng: 90.41 },
  { name: "Beijing", country: "China", lat: 39.9, lng: 116.4 },
  { name: "Jakarta", country: "Indonesia", lat: -6.21, lng: 106.85 },
  { name: "Cairo", country: "Egypt", lat: 30.04, lng: 31.24 },
  { name: "Mexico City", country: "Mexico", lat: 19.43, lng: -99.13 },
  { name: "São Paulo", country: "Brazil", lat: -23.55, lng: -46.63 },
  { name: "Lagos", country: "Nigeria", lat: 6.52, lng: 3.38 },
  { name: "Los Angeles", country: "United States", lat: 34.05, lng: -118.24 },
  { name: "Milan", country: "Italy", lat: 45.46, lng: 9.19 },
  { name: "Santiago", country: "Chile", lat: -33.45, lng: -70.67 },
  { name: "Tehran", country: "Iran", lat: 35.69, lng: 51.39 },
  { name: "Ulaanbaatar", country: "Mongolia", lat: 47.89, lng: 106.91 },
];

/** European AQI bands, published by the provider alongside the measurement. */
function severityForAqi(aqi: number): Severity | null {
  if (aqi >= 100) return "critical"; // extremely poor
  if (aqi >= 80) return "high"; // very poor
  if (aqi >= 60) return "moderate"; // poor
  return null; // fair or better — not a signal worth surfacing
}

export async function fetchAirQuality(): Promise<NexusEvent[]> {
  const latitudes = CITIES.map((c) => c.lat).join(",");
  const longitudes = CITIES.map((c) => c.lng).join(",");
  const url =
    `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitudes}` +
    `&longitude=${longitudes}&current=european_aqi,pm2_5,pm10&timezone=UTC`;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Open-Meteo air quality responded ${response.status}`);
  const payload = (await response.json()) as
    | { current?: { european_aqi?: number; pm2_5?: number; time?: string } }
    | { current?: { european_aqi?: number; pm2_5?: number; time?: string } }[];

  const rows = Array.isArray(payload) ? payload : [payload];
  const out: NexusEvent[] = [];

  rows.forEach((row, index) => {
    const city = CITIES[index];
    const current = row?.current;
    if (!city || !current || typeof current.european_aqi !== "number") return;
    const severity = severityForAqi(current.european_aqi);
    if (!severity) return;

    const timestampMs = current.time ? Date.parse(`${current.time}Z`) : Date.now();
    out.push({
      id: `aq-${city.name.toLowerCase().replace(/\s+/g, "-")}`,
      title: `Unhealthy air quality in ${city.name}`,
      domain: "climate",
      severity,
      location: city.name,
      country: city.country,
      lat: city.lat,
      lng: city.lng,
      detectedMinutesAgo: Math.max(0, (Date.now() - timestampMs) / 60000),
      source: "Open-Meteo Air Quality (CAMS European AQI)",
      metric: `AQI ${Math.round(current.european_aqi)}${
        typeof current.pm2_5 === "number" ? ` · PM2.5 ${current.pm2_5.toFixed(0)} µg/m³` : ""
      }`,
      summary: `Measured air quality in ${city.name} is currently in the ${
        severity === "critical" ? "extremely poor" : severity === "high" ? "very poor" : "poor"
      } band of the European AQI. Sensitive groups are most affected; local health guidance applies.`,
      links: [],
      isLive: true,
      verified: true,
      sourceUrl: "https://open-meteo.com/en/docs/air-quality-api",
      ...(Number.isFinite(timestampMs) ? { timestampMs } : {}),
    });
  });

  return out;
}
