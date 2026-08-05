import type { NexusEvent, Severity } from "@/data/events";
import { COUNTRY_CENTROIDS } from "./geo";

// European Central Bank euro reference rates — public XML, no API key.
// The 90-day history lets us measure real currency stress against USD.
const ECB_HIST_90D = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist-90d.xml";

const CURRENCY_PLACE: Record<string, { country: string; key: string; label: string }> = {
  EUR: { country: "Euro area", key: "germany", label: "Euro" },
  GBP: { country: "United Kingdom", key: "united kingdom", label: "Pound sterling" },
  JPY: { country: "Japan", key: "japan", label: "Japanese yen" },
  CNY: { country: "China", key: "china", label: "Chinese yuan" },
  INR: { country: "India", key: "india", label: "Indian rupee" },
  BRL: { country: "Brazil", key: "brazil", label: "Brazilian real" },
  MXN: { country: "Mexico", key: "mexico", label: "Mexican peso" },
  ZAR: { country: "South Africa", key: "south africa", label: "South African rand" },
  TRY: { country: "Türkiye", key: "türkiye", label: "Turkish lira" },
  KRW: { country: "South Korea", key: "south korea", label: "South Korean won" },
  IDR: { country: "Indonesia", key: "indonesia", label: "Indonesian rupiah" },
  PLN: { country: "Poland", key: "poland", label: "Polish zloty" },
  SEK: { country: "Sweden", key: "sweden", label: "Swedish krona" },
  CAD: { country: "Canada", key: "canada", label: "Canadian dollar" },
  AUD: { country: "Australia", key: "australia", label: "Australian dollar" },
};

interface DayRates {
  date: string;
  ms: number;
  /** Units of each currency per 1 USD. */
  perUsd: Record<string, number>;
}

function severityForMove(pct: number): Severity {
  const abs = Math.abs(pct);
  if (abs >= 8) return "critical";
  if (abs >= 5) return "high";
  if (abs >= 3) return "moderate";
  return "watch";
}

/** ECB quotes everything per EUR; re-base to USD so moves read as dollar stress. */
function parseDays(xml: string): DayRates[] {
  const blocks = xml.match(/<Cube time="[^"]+">[\s\S]*?<\/Cube>/g) ?? [];
  const days: DayRates[] = [];

  for (const block of blocks) {
    const date = block.match(/time="([^"]+)"/)?.[1];
    if (!date) continue;
    const perEur: Record<string, number> = { EUR: 1 };
    for (const m of block.matchAll(/currency="([A-Z]{3})"\s+rate="([\d.]+)"/g)) {
      const code = m[1];
      const rate = Number(m[2]);
      if (code && Number.isFinite(rate)) perEur[code] = rate;
    }
    const usdPerEur = perEur["USD"];
    if (!usdPerEur) continue;

    const perUsd: Record<string, number> = {};
    for (const [code, rate] of Object.entries(perEur)) perUsd[code] = rate / usdPerEur;
    days.push({ date, ms: Date.parse(date), perUsd });
  }

  return days.sort((a, b) => b.ms - a.ms);
}

export async function fetchCurrencyStress(): Promise<NexusEvent[]> {
  const response = await fetch(ECB_HIST_90D, {
    headers: { "User-Agent": "NexusEarth/1.0 (live-events feed)" },
  });
  if (!response.ok) throw new Error(`ECB reference rates responded ${response.status}`);
  const days = parseDays(await response.text());

  const latest = days[0];
  if (!latest) throw new Error("ECB reference rates returned no usable days");
  const targetMs = latest.ms - 1000 * 60 * 60 * 24 * 30;
  const before = days.reduce((best, day) =>
    Math.abs(day.ms - targetMs) < Math.abs(best.ms - targetMs) ? day : best,
  );

  const events: NexusEvent[] = [];
  for (const [code, place] of Object.entries(CURRENCY_PLACE)) {
    const now = latest.perUsd[code];
    const then = before.perUsd[code];
    const coords = COUNTRY_CENTROIDS[place.key];
    if (!now || !then || !coords) continue;

    // Units-per-USD rising means the local currency weakened.
    const pct = ((now - then) / then) * 100;
    if (Math.abs(pct) < 2) continue;

    events.push({
      id: `fx-${code}`,
      title: `${place.label} ${pct > 0 ? "weakened" : "strengthened"} ${Math.abs(pct).toFixed(1)}% vs USD in 30 days`,
      domain: "financial",
      severity: severityForMove(pct),
      location: place.country,
      country: place.country,
      lat: coords[0],
      lng: coords[1],
      detectedMinutesAgo: Math.max(0, (Date.now() - latest.ms) / 60000),
      source: "ECB euro reference rates",
      metric: `USD/${code} ${now.toFixed(4)} · ${pct > 0 ? "+" : ""}${pct.toFixed(1)}% 30d`,
      summary: `USD/${code} moved from ${then.toFixed(4)} (${before.date}) to ${now.toFixed(4)} (${latest.date}), a ${pct > 0 ? "+" : ""}${pct.toFixed(1)}% shift — a live indicator of currency and import-cost stress in ${place.country}.`,
      links: [],
      isLive: true,
      timestampMs: latest.ms,
    });
  }

  return events
    .sort((a, b) => Math.abs(b.detectedMinutesAgo) - Math.abs(a.detectedMinutesAgo))
    .slice(0, 8);
}
