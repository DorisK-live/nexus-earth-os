import { useCallback, useEffect, useState } from "react";
import { Sparkles, TriangleAlert, X } from "lucide-react";

import { DOMAIN_LABELS, SEVERITY_COLOR, SEVERITY_LABELS, type NexusEvent } from "@/data/events";
import { DOMAIN_ICONS } from "@/components/events/EventRail";

export interface Analysis {
  whyItMatters: string;
  impacts: {
    sector: string;
    headline: string;
    detail: string;
    probability: number;
    confidence: number;
    horizon: string;
  }[];
  timeline: { window: string; development: string }[];
  actions: { audience: string; action: string }[];
}

interface Props {
  event: NexusEvent | null;
  onClose: () => void;
}

export function ImpactPanel({ event, onClose }: Props) {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (target: NexusEvent, signal: AbortSignal) => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal,
        body: JSON.stringify({
          title: target.title,
          domain: DOMAIN_LABELS[target.domain],
          severity: SEVERITY_LABELS[target.severity],
          location: target.location,
          country: target.country,
          metric: target.metric,
          summary: target.summary,
        }),
      });
      const payload = (await response.json()) as Analysis & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Analysis failed.");
      setAnalysis(payload);
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const eventId = event?.id ?? null;
  useEffect(() => {
    if (!event || !eventId) return;
    const controller = new AbortController();
    void run(event, controller.signal);
    return () => controller.abort();
    // Keyed on the signal id only: live refreshes hand back new object identities for
    // the same signal, and re-running would blank the panel while the user is reading.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, run]);

  if (!event) return null;

  const Icon = DOMAIN_ICONS[event.domain];
  const accent = SEVERITY_COLOR[event.severity];

  return (
    <aside
      aria-label={`Impact analysis for ${event.title}`}
      className="glass animate-rise flex h-full min-h-0 flex-col overflow-hidden rounded-xl"
    >
      <header className="flex items-start gap-3 border-b border-glass-border p-4">
        <span
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
          style={{ backgroundColor: `color-mix(in oklab, ${accent} 18%, transparent)` }}
        >
          <Icon className="h-4 w-4" style={{ color: accent }} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p
            className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.16em]"
            style={{ color: accent }}
          >
            {event.isLive && (
              <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-primary">Live</span>
            )}
            <span>
              {SEVERITY_LABELS[event.severity]} · {DOMAIN_LABELS[event.domain]}
            </span>
          </p>
          <h3 className="mt-1 text-base font-semibold leading-snug text-foreground">
            {event.title}
          </h3>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">
            {event.location}, {event.country} · {event.metric} · {event.source}
          </p>
          <p className="mt-1.5 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em]">
            {event.verified === false ? (
              <span className="rounded-full bg-secondary px-1.5 py-0.5 text-muted-foreground">
                Derived · not agency-verified
              </span>
            ) : (
              <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-primary">
                Verified source
              </span>
            )}
            {event.sourceUrl && (
              <a
                href={event.sourceUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 rounded-full border border-glass-border px-1.5 py-0.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                Check at source
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close analysis"
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div
        className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-4"
        style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}
      >
        <p className="text-sm leading-relaxed text-muted-foreground">{event.summary}</p>

        <div className="flex items-center gap-2 border-t border-glass-border pt-4">
          <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          <h4 className="font-mono text-[11px] uppercase tracking-[0.16em] text-primary">
            NEXUS impact chain
          </h4>
        </div>

        {loading && <AnalysisSkeleton />}

        {error && !loading && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-foreground">
            <TriangleAlert
              className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
              aria-hidden="true"
            />
            <div>
              <p>{error}</p>
              <button
                type="button"
                className="mt-2 rounded-md border border-border px-2 py-1 text-xs transition-colors hover:bg-secondary"
                onClick={() => {
                  const controller = new AbortController();
                  void run(event, controller.signal);
                }}
              >
                Re-run analysis
              </button>
            </div>
          </div>
        )}

        {analysis && !loading && (
          <div className="space-y-6">
            <p className="text-sm leading-relaxed text-foreground">{analysis.whyItMatters}</p>

            <section aria-label="Predicted cascading impacts" className="space-y-3">
              {analysis.impacts.map((impact) => (
                <article
                  key={`${impact.sector}-${impact.headline}`}
                  className="rounded-lg border border-glass-border bg-surface/50 p-3"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                        {impact.sector} · {impact.horizon}
                      </p>
                      <p className="mt-0.5 text-sm font-medium text-foreground">
                        {impact.headline}
                      </p>
                    </div>
                    <span className="shrink-0 font-display text-lg tabular-nums text-foreground">
                      {impact.probability}%
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    {impact.detail}
                  </p>
                  <div className="mt-3 space-y-1.5">
                    <Meter label="Probability" value={impact.probability} color={accent} />
                    <Meter label="Confidence" value={impact.confidence} color="var(--signal)" />
                  </div>
                </article>
              ))}
            </section>

            <section aria-label="72 hour outlook">
              <h5 className="mb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                Next 72 hours
              </h5>
              <ol className="space-y-3 border-l border-glass-border pl-4">
                {analysis.timeline.map((step) => (
                  <li key={step.window} className="relative">
                    <span
                      className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full"
                      style={{ backgroundColor: accent }}
                      aria-hidden="true"
                    />
                    <p className="font-mono text-[11px] text-primary">{step.window}</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {step.development}
                    </p>
                  </li>
                ))}
              </ol>
            </section>

            <section aria-label="Recommended actions">
              <h5 className="mb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                Recommended action by audience
              </h5>
              <div className="grid gap-2 sm:grid-cols-2">
                {analysis.actions.map((action) => (
                  <div
                    key={action.audience}
                    className="rounded-lg border border-glass-border bg-surface/50 p-3"
                  >
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
                      {action.audience}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {action.action}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </aside>
  );
}

function Meter({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-8 shrink-0 text-right font-mono text-[10px] tabular-nums text-muted-foreground">
        {value}
      </span>
    </div>
  );
}

function AnalysisSkeleton() {
  return (
    <div className="space-y-3" aria-live="polite" aria-busy="true">
      <p className="font-mono text-[11px] text-muted-foreground">
        Correlating against 9 intelligence domains…
      </p>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="relative overflow-hidden rounded-lg border border-glass-border bg-surface/40 p-3"
        >
          <div className="h-2.5 w-24 rounded bg-secondary" />
          <div className="mt-2 h-3 w-3/4 rounded bg-secondary" />
          <div className="mt-2 h-2 w-full rounded bg-secondary/70" />
          <div className="mt-3 h-1 w-full rounded bg-secondary" />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent"
            style={{ animation: "nexus-sweep 1.6s linear infinite" }}
            aria-hidden="true"
          />
        </div>
      ))}
    </div>
  );
}
