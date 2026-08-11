import type { Domain, NexusEvent, Severity } from "@/data/events";

// GDACS (Global Disaster Alert and Coordination System) — UN/EU-backed, public,
// free, no API key. Long-running RSS+GeoRSS feed covering active multi-hazard alerts.
const GDACS_RSS_URL = "https://www.gdacs.org/xml/rss.xml";

const EVENT_TYPE_DOMAIN: Record<string, Domain> = {
  EQ: "disaster", // earthquake (kept separate from USGS as a cross-check / fallback)
  VO: "disaster", // volcano
  WF: "disaster", // wildfire
  TC: "climate", // tropical cyclone
  FL: "climate", // flood
  DR: "climate", // drought
};

const EVENT_TYPE_LABEL: Record<string, string> = {
  EQ: "Earthquake",
  VO: "Volcanic activity",
  WF: "Wildfire",
  TC: "Tropical cyclone",
  FL: "Flood",
  DR: "Drought",
};

const ALERT_SEVERITY: Record<string, Severity> = {
  red: "critical",
  orange: "high",
  green: "watch",
};

/** Minimal, dependency-free tag extraction — safe on both Node and Workers runtimes (no DOMParser needed). */
function extractTag(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  const captured = match?.[1];
  if (captured == null) return null;
  return captured
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .trim();
}

function extractAttr(xml: string, tag: string, attr: string): string | null {
  const match = xml.match(new RegExp(`<${tag}[^>]*\\b${attr}="([^"]*)"[^>]*>`, "i"));
  return match?.[1] ?? null;
}

function parseItem(itemXml: string): NexusEvent | null {
  try {
    const eventType = extractTag(itemXml, "gdacs:eventtype");
    const alertLevel = extractTag(itemXml, "gdacs:alertlevel");
    const eventId = extractTag(itemXml, "gdacs:eventid");
    const country = extractTag(itemXml, "gdacs:country");
    const title = extractTag(itemXml, "title");
    const description = extractTag(itemXml, "description");
    const link = extractTag(itemXml, "link");
    const pubDate = extractTag(itemXml, "pubDate");
    const point = extractTag(itemXml, "georss:point");

    if (!eventType || !point || !title) return null;
    const domain = EVENT_TYPE_DOMAIN[eventType];
    if (!domain) return null; // unrecognised hazard type — skip rather than guess

    const [latStr, lngStr] = point.split(/\s+/);
    const lat = Number(latStr);
    const lng = Number(lngStr);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    const severity = ALERT_SEVERITY[(alertLevel ?? "").toLowerCase()] ?? "moderate";
    const timestampMs = pubDate ? Date.parse(pubDate) : NaN;
    const ageMinutes = Number.isFinite(timestampMs)
      ? Math.max(0, (Date.now() - timestampMs) / 60000)
      : 0;

    const severityValue = extractAttr(itemXml, "gdacs:severity", "value");
    const severityUnit = extractAttr(itemXml, "gdacs:severity", "unit");

    return {
      id: `gdacs-${eventId ?? `${eventType}-${lat}-${lng}`}`,
      title,
      domain,
      severity,
      location: country ?? "—",
      country: country ?? "—",
      lat,
      lng,
      detectedMinutesAgo: ageMinutes,
      source: "GDACS (Global Disaster Alert and Coordination System)",
      metric: severityValue
        ? `${EVENT_TYPE_LABEL[eventType] ?? eventType} · ${severityValue}${severityUnit ?? ""}`
        : (EVENT_TYPE_LABEL[eventType] ?? eventType),
      summary: description ?? title,
      links: [],
      isLive: true,
      verified: true,
      ...(link ? { sourceUrl: link } : {}),
      ...(Number.isFinite(timestampMs) ? { timestampMs } : {}),
    };
  } catch {
    return null; // one malformed item should never take down the whole feed
  }
}

export async function fetchGdacsEvents(): Promise<NexusEvent[]> {
  const response = await fetch(GDACS_RSS_URL, {
    headers: { "User-Agent": "NexusEarth/1.0 (live-events feed)" },
  });
  if (!response.ok) throw new Error(`GDACS feed responded ${response.status}`);
  const xml = await response.text();
  const items = xml.match(/<item>[\s\S]*?<\/item>/gi) ?? [];
  return items
    .map(parseItem)
    .filter((e): e is NexusEvent => e !== null)
    .sort((a, b) => a.detectedMinutesAgo - b.detectedMinutesAgo)
    .slice(0, 20);
}
