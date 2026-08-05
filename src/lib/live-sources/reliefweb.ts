import type { NexusEvent, Severity } from "@/data/events";

// ReliefWeb (OCHA/UN) — public, free, no API key beyond an "appname" identifier.
const RELIEFWEB_URL = "https://api.reliefweb.int/v1/disasters?appname=nexus-earth-os";

interface ReliefWebCountry {
  name?: string;
  iso3?: string;
  location?: { lat: number; lon: number };
}

interface ReliefWebDisaster {
  id: string;
  fields?: {
    name?: string;
    status?: string;
    date?: { created?: string };
    country?: ReliefWebCountry[];
    type?: { name?: string }[];
    description?: string;
    glide?: string;
  };
}

interface ReliefWebResponse {
  data?: ReliefWebDisaster[];
}

function severityForStatus(status: string | undefined): Severity {
  if (status === "alert") return "critical";
  if (status === "current") return "high";
  return "moderate";
}

function toNexusEvent(item: ReliefWebDisaster): NexusEvent | null {
  try {
    const f = item.fields;
    if (!f?.name) return null;
    const country = f.country?.find((c) => c.location) ?? f.country?.[0];
    if (!country?.location) return null; // no coordinates to plot — skip rather than guess

    const { lat, lon } = country.location;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

    const createdMs = f.date?.created ? Date.parse(f.date.created) : NaN;
    const ageMinutes = Number.isFinite(createdMs)
      ? Math.max(0, (Date.now() - createdMs) / 60000)
      : 0;
    const typeLabel = f.type?.[0]?.name ?? "Humanitarian situation";

    return {
      id: `reliefweb-${item.id}`,
      title: f.name,
      domain: "humanitarian",
      severity: severityForStatus(f.status),
      location: country.name ?? "—",
      country: country.name ?? "—",
      lat,
      lng: lon,
      detectedMinutesAgo: ageMinutes,
      source: "ReliefWeb (UN OCHA)",
      metric: typeLabel,
      summary: f.description ?? f.name,
      links: [],
      isLive: true,
      ...(Number.isFinite(createdMs) ? { timestampMs: createdMs } : {}),
    };
  } catch {
    return null;
  }
}

export async function fetchReliefWebEvents(): Promise<NexusEvent[]> {
  const response = await fetch(RELIEFWEB_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      limit: 15,
      sort: ["date.created:desc"],
      filter: { field: "status", value: ["alert", "current"], operator: "OR" },
    }),
  });
  if (!response.ok) throw new Error(`ReliefWeb responded ${response.status}`);
  const payload = (await response.json()) as ReliefWebResponse;
  return (payload.data ?? [])
    .map(toNexusEvent)
    .filter((e): e is NexusEvent => e !== null)
    .sort((a, b) => a.detectedMinutesAgo - b.detectedMinutesAgo)
    .slice(0, 15);
}
