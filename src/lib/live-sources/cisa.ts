import type { NexusEvent, Severity } from "@/data/events";
import { jitter, lookupCentroid } from "./geo";

// CISA — all cybersecurity advisories, public RSS, no API key.
const CISA_RSS = "https://www.cisa.gov/cybersecurity-advisories/all.xml";
const CISA_HQ: [number, number] = [38.89, -77.03];

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

function severityFor(text: string): Severity {
  const t = text.toLowerCase();
  if (/known exploited|actively exploited|emergency directive|ransomware/.test(t)) return "critical";
  if (/critical infrastructure|remote code execution|ics medical/.test(t)) return "high";
  if (/vulnerabilit|advisory/.test(t)) return "moderate";
  return "watch";
}

export async function fetchCisaAdvisories(): Promise<NexusEvent[]> {
  const response = await fetch(CISA_RSS, {
    headers: { "User-Agent": "NexusEarth/1.0 (live-events feed)" },
  });
  if (!response.ok) throw new Error(`CISA responded ${response.status}`);
  const xml = await response.text();
  const items = (xml.match(/<item>[\s\S]*?<\/item>/gi) ?? []).slice(0, 40);

  const cutoff = Date.now() - 1000 * 60 * 60 * 24 * 21;

  return items
    .map((itemXml): NexusEvent | null => {
      const title = tag(itemXml, "title");
      if (!title) return null;
      const description = tag(itemXml, "description") ?? title;
      const link = tag(itemXml, "link");
      const pubDate = tag(itemXml, "pubDate");
      const ms = pubDate ? Date.parse(pubDate) : NaN;
      if (Number.isFinite(ms) && ms < cutoff) return null;

      const coords = lookupCentroid(`${title} ${description}`) ?? CISA_HQ;
      const [dLat, dLng] = jitter(link ?? title, 2.4);
      const ageMinutes = Number.isFinite(ms) ? Math.max(0, (Date.now() - ms) / 60000) : 0;

      return {
        id: `cisa-${link ?? title}`,
        title,
        domain: "cyber",
        severity: severityFor(`${title} ${description}`),
        location: "CISA advisory",
        country: "Global",
        lat: coords[0] + dLat,
        lng: coords[1] + dLng,
        detectedMinutesAgo: ageMinutes,
        source: "CISA Cybersecurity Advisories",
        metric: "Advisory",
        summary: description.slice(0, 400),
        links: [],
        isLive: true,
        ...(Number.isFinite(ms) ? { timestampMs: ms } : {}),
      };
    })
    .filter((e): e is NexusEvent => e !== null)
    .slice(0, 12);
}
