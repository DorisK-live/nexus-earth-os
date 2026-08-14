import { useMemo } from "react";
import { Activity, ArrowUpRight } from "lucide-react";

import { DOMAIN_LABELS, SEVERITY_LABELS, type NexusEvent } from "@/data/events";
import { assessRisk, RISK_BANDS } from "@/lib/intelligence/risk";
import type { LiveSourceStatus } from "@/hooks/use-live-events";

interface Props {
  events: NexusEvent[];
  sources: LiveSourceStatus[];
  onSelect: (id: string) => void;
}

type Bucket = "critical" | "developing" | "watch" | "stabilized";

const BUCKET_COPY: Record<Bucket, { title: string; blurb: string }> = {
  critical: { title: "Critical now", blurb: "Highest scored signals in the last hours" },
  developing: { title: "Developing", blurb: "Elevated risk, situation still moving" },
  watch: { title: "Watch", blurb: "Monitored, no elevated impact indicated yet" },
  stabilized: { title: "Recently stabilized", blurb: "Older signals with easing risk" },
};

function ageHours(event: NexusEvent) {
  return event.timestampMs
    ? (Date.now() - event.timestampMs) / 3600000
    : event.detectedMinutesAgo / 60;
}

export function SituationRoom({ events, sources, onSelect }: Props) {
  const scored = useMemo(
    () =>
      events
        .filter((e) => e.isLive)
        .map((event) => ({ event, risk: assessRisk(event, events) }))
        .sort((a, b) => b.risk.score - a.risk.score),
    [events],
  );

  const buckets = useMemo(() => {
    const out: Record<Bucket, typeof scored> = {
      critical: [],
      developing: [],
      watch: [],
      stabilized: [],
    };
    for (const item of scored) {
      const hours = ageHours(item.event);
      if (item.risk.score >= 70 && hours <= 48) out.critical.push(item);
      else if (item.risk.score >= 45) out.developing.push(item);
      else if (hours > 48) out.stabilized.push(item);
      else out.watch.push(item);
    }
    return out;
  }, [scored]);

  const pulse = useMemo(
    () => ({
      critical: scored.filter((s) => s.risk.band === "critical").length,
      high: scored.filter((s) => s.risk.band === "high").length,
      regions: new Set(scored.map((s) => s.event.country)).size,
      providers: sources.filter((s) => s.ok).length,
    }),
    [scored, sources],
  );

  return (
    <section id="situation-room" className="border-t border-glass-border">
      <div className="mx-auto w-full max-w-7xl px-6 py-16">
        <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.28em] text-primary">
          <Activity className="h-3.5 w-3.5" aria-hidden="true" />
          Situation room
        </p>
        <h2 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
          The world, ranked by what actually needs attention.
        </h2>

        <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Critical events", value: pulse.critical },
            { label: "High-risk events", value: pulse.high },
            { label: "Monitored regions", value: pulse.regions },
            { label: "Verified providers online", value: pulse.providers },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-glass-border bg-surface/40 p-4"
            >
              <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                {stat.label}
              </dt>
              <dd className="mt-2 text-3xl font-semibold tabular-nums text-foreground">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          Global risk pulse · counted from live provider data only
        </p>

        {scored.length === 0 ? (
          <p className="mt-8 rounded-xl border border-glass-border bg-surface/40 p-6 text-sm text-muted-foreground">
            Data temporarily unavailable — no live provider signals to rank right now.
          </p>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {(Object.keys(BUCKET_COPY) as Bucket[]).map((bucket) => (
              <div
                key={bucket}
                className="flex min-w-0 flex-col rounded-xl border border-glass-border bg-surface/30 p-4"
              >
                <h3 className="font-mono text-[11px] uppercase tracking-[0.16em] text-foreground">
                  {BUCKET_COPY[bucket].title}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">{BUCKET_COPY[bucket].blurb}</p>
                <ul className="mt-4 space-y-2">
                  {buckets[bucket].slice(0, 4).map(({ event, risk }) => (
                    <li key={event.id}>
                      <button
                        type="button"
                        onClick={() => onSelect(event.id)}
                        className="group w-full rounded-lg border border-transparent bg-background/40 p-3 text-left transition-colors hover:border-glass-border"
                      >
                        <span className="flex items-start justify-between gap-2">
                          <span className="min-w-0 text-sm font-medium leading-snug text-foreground">
                            {event.title}
                          </span>
                          <span className="shrink-0 font-mono text-sm tabular-nums text-primary">
                            {risk.score}
                          </span>
                        </span>
                        <span className="mt-1 block break-words font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                          {event.location}, {event.country} · {DOMAIN_LABELS[event.domain]} ·{" "}
                          {SEVERITY_LABELS[event.severity]}
                        </span>
                        <span className="mt-1 block font-mono text-[10px] text-muted-foreground">
                          {RISK_BANDS[risk.band].label} risk · updated{" "}
                          {Math.max(1, Math.round(ageHours(event)))}h ago
                        </span>
                        <span className="mt-1 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-primary opacity-0 transition-opacity group-hover:opacity-100">
                          View full intelligence
                          <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                        </span>
                      </button>
                    </li>
                  ))}
                  {buckets[bucket].length === 0 && (
                    <li className="rounded-lg bg-background/30 p-3 text-xs text-muted-foreground">
                      Nothing in this band right now.
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
