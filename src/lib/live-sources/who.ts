import type { NexusEvent, Severity } from "@/data/events";
import { jitter, lookupCentroid } from "./geo";

// WHO Disease Outbreak News — public OData feed, no API key.
const WHO_URL =
  "https://www.who.int/api/news/diseaseoutbreaknews?sf_provider=dynamicProvider372&sf_culture=en&%24orderby=PublicationDateAndTime%20desc&%24select=Title,PublicationDateAndTime,UrlName,Summary&%24top=25";

interface WhoItem {
  Title?: string;
  Summary?: string;
  UrlName?: string;
  PublicationDateAndTime?: string;
}

function severityFor(text: string, ageDays: number): Severity {
  const t = text.toLowerCase();
  if (/ebola|marburg|cholera outbreak|h5n1|pandemic|public health emergency/.test(t))
    return "critical";
  if (ageDays < 7) return "high";
  if (ageDays < 30) return "moderate";
  return "watch";
}

export async function fetchWhoOutbreaks(): Promise<NexusEvent[]> {
  const response = await fetch(WHO_URL, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`WHO responded ${response.status}`);
  const payload = (await response.json()) as { value?: WhoItem[] };

  return (payload.value ?? [])
    .map((item): NexusEvent | null => {
      const title = item.Title?.trim();
      if (!title) return null;
      const place = title.split(/[–—-]/).slice(1).join(" ").trim() || title;
      const coords = lookupCentroid(place) ?? lookupCentroid(title);
      if (!coords) return null; // no plottable location — skip rather than guess
      const ms = item.PublicationDateAndTime ? Date.parse(item.PublicationDateAndTime) : NaN;
      const ageMinutes = Number.isFinite(ms) ? Math.max(0, (Date.now() - ms) / 60000) : 0;
      const [dLat, dLng] = jitter(item.UrlName ?? title, 0.8);

      return {
        id: `who-${item.UrlName ?? title}`,
        title,
        domain: "outbreak",
        severity: severityFor(`${title} ${item.Summary ?? ""}`, ageMinutes / 1440),
        location: place,
        country: place,
        lat: coords[0] + dLat,
        lng: coords[1] + dLng,
        detectedMinutesAgo: ageMinutes,
        source: "WHO Disease Outbreak News",
        metric: "Disease Outbreak News",
        summary: item.Summary ?? title,
        links: [],
        isLive: true,
        verified: true,
        ...(item.UrlName
          ? { sourceUrl: `https://www.who.int/emergencies/disease-outbreak-news/item/${item.UrlName}` }
          : {}),
        ...(Number.isFinite(ms) ? { timestampMs: ms } : {}),
      };
    })
    .filter((e): e is NexusEvent => e !== null)
    .slice(0, 12);
}
