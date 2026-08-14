import { useCallback, useMemo, useState } from "react";
import { Crosshair, Loader2, Search } from "lucide-react";

import { DOMAIN_LABELS, type NexusEvent } from "@/data/events";
import { assessRisk, RISK_BANDS } from "@/lib/intelligence/risk";
import { distanceKm } from "@/lib/live-sources/geo";

interface Props {
  events: NexusEvent[];
  onSelect: (id: string) => void;
}

const RADII = [50, 100, 250, 500] as const;

interface Anchor {
  label: string;
  lat: number;
  lng: number;
}

export function LocationIntelligence({ events, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [radius, setRadius] = useState<number>(250);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async () => {
    const term = query.trim();
    if (!term) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(term)}&count=1&language=en&format=json`,
      );
      const payload = (await response.json()) as {
        results?: { name: string; country?: string; latitude: number; longitude: number }[];
      };
      const hit = payload.results?.[0];
      if (!hit) {
        setError(`No place found for “${term}”.`);
        setAnchor(null);
        return;
      }
      setAnchor({
        label: hit.country ? `${hit.name}, ${hit.country}` : hit.name,
        lat: hit.latitude,
        lng: hit.longitude,
      });
    } catch {
      setError("Place lookup is temporarily unavailable.");
    } finally {
      setBusy(false);
    }
  }, [query]);

  const useMyLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("This browser cannot share a location.");
      return;
    }
    setBusy(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setAnchor({
          label: "Your current location",
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setBusy(false);
      },
      () => {
        setError("Location permission was declined — search a place name instead.");
        setBusy(false);
      },
      { timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  const nearby = useMemo(() => {
    if (!anchor) return [];
    return events
      .map((event) => ({
        event,
        km: distanceKm(anchor.lat, anchor.lng, event.lat, event.lng),
      }))
      .filter((item) => item.km <= radius)
      .sort((a, b) => a.km - b.km)
      .slice(0, 8)
      .map((item) => ({ ...item, risk: assessRisk(item.event, events) }));
  }, [anchor, events, radius]);

  const summary = useMemo(() => {
    if (!anchor) return null;
    if (nearby.length === 0)
      return `No verified signals inside ${radius} km of ${anchor.label} right now.`;
    const top = Math.max(...nearby.map((n) => n.risk.score));
    return `${nearby.length} signal${nearby.length === 1 ? "" : "s"} within ${radius} km of ${anchor.label}. Highest NEXUS risk score ${top}.`;
  }, [anchor, nearby, radius]);

  return (
    <section id="near-me" className="border-t border-glass-border">
      <div className="mx-auto w-full max-w-7xl px-6 py-16">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-primary">
          Location intelligence
        </p>
        <h2 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
          What&apos;s happening near me?
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Search any country, city or region — or share your location once, only when you tap the
          button. NEXUS never tracks you in the background and nothing is stored.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-glass-border bg-surface/40 px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void search();
              }}
              placeholder="Search country, city or region"
              aria-label="Search country, city or region"
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            <button
              type="button"
              onClick={() => void search()}
              className="shrink-0 rounded-lg border border-glass-border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-foreground transition-colors hover:bg-secondary"
            >
              Search
            </button>
          </div>
          <button
            type="button"
            onClick={useMyLocation}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-glass-border bg-surface/40 px-3 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-foreground transition-colors hover:bg-secondary"
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Crosshair className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            Use my location
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {RADII.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRadius(value)}
              aria-pressed={radius === value}
              className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors ${
                radius === value
                  ? "border-primary/50 bg-primary/15 text-primary"
                  : "border-glass-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {value} km
            </button>
          ))}
        </div>

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
        {summary && <p className="mt-4 text-sm text-muted-foreground">{summary}</p>}

        {nearby.length > 0 && (
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {nearby.map(({ event, km, risk }) => (
              <li key={event.id}>
                <button
                  type="button"
                  onClick={() => onSelect(event.id)}
                  className="w-full rounded-xl border border-glass-border bg-surface/30 p-4 text-left transition-colors hover:bg-surface/60"
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="min-w-0 text-sm font-medium leading-snug text-foreground">
                      {event.title}
                    </span>
                    <span className="shrink-0 font-mono text-sm tabular-nums text-primary">
                      {risk.score}
                    </span>
                  </span>
                  <span className="mt-1 block break-words font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    {Math.round(km)} km · {event.location}, {event.country} ·{" "}
                    {DOMAIN_LABELS[event.domain]} · {RISK_BANDS[risk.band].label}
                  </span>
                  <span className="mt-1 block font-mono text-[10px] text-muted-foreground">
                    {event.source}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
