import type { NexusEvent, Severity } from "@/data/events";
import { jitter, lookupCentroid } from "./geo";

// ReliefWeb (UN OCHA) public disasters RSS — no API key or approved appname needed.
const RELIEFWEB_RSS = "https://reliefweb.int/disasters/rss.xml";

function tag(xml: string, name: string): string | null {
  const match = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, "i"));
  const captured = match?.[1];
  if (captured == null) return null;
  return captured
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function severityFor(text: string, ageDays: number): Severity {
  const t = text.toLowerCase();
  if (/famine|epidemic|complex emergency|conflict|displacement/.test(t)) return "critical";
  if (ageDays < 14) return "high";
  if (ageDays < 60) return "moderate";
  return "watch";
}

export async function fetchReliefWebEvents(): Promise<NexusEvent[]> {
  const response = await fetch(RELIEFWEB_RSS, {
    headers: { "User-Agent": "NexusEarth/1.0 (live-events feed)", Accept: "application/rss+xml, application/xml;q=0.9, */*;q=0.8" },
  });
  if (!response.ok) throw new Error(`ReliefWeb responded ${response.status}`);
  const xml = await response.text();
  const items = (xml.match(/<item>[\s\S]*?<\/item>/gi) ?? []).slice(0, 40);

  return items
    .map((itemXml): NexusEvent | null => {
      const title = tag(itemXml, "title");
      if (!title) return null;
      // Titles look like "Nigeria: Floods - Aug 2026".
      const place = (title.split(":")[0] ?? title).trim();
      const coords = lookupCentroid(place) ?? lookupCentroid(title);
      if (!coords) return null; // no plottable location — skip rather than guess

      const link = tag(itemXml, "link");
      const description = tag(itemXml, "description") ?? title;
      const pubDate = tag(itemXml, "pubDate");
      const ms = pubDate ? Date.parse(pubDate) : NaN;
      const ageMinutes = Number.isFinite(ms) ? Math.max(0, (Date.now() - ms) / 60000) : 0;
      const [dLat, dLng] = jitter(link ?? title, 1.2);
      const typeLabel = (title.split(":")[1] ?? "Humanitarian situation").split("-")[0]?.trim();

      return {
        id: `reliefweb-${link ?? title}`,
        title,
        domain: "humanitarian",
        severity: severityFor(`${title} ${description}`, ageMinutes / 1440),
        location: place,
        country: place,
        lat: coords[0] + dLat,
        lng: coords[1] + dLng,
        detectedMinutesAgo: ageMinutes,
        source: "ReliefWeb (UN OCHA)",
        metric: typeLabel || "Humanitarian situation",
        summary: description.slice(0, 400),
        links: [],
        isLive: true,
        ...(Number.isFinite(ms) ? { timestampMs: ms } : {}),
      };
    })
    .filter((e): e is NexusEvent => e !== null)
    .slice(0, 15);
}
