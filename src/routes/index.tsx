import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Globe2 } from "lucide-react";

import { GlobeStage } from "@/components/globe/GlobeStage";
import { EventRail } from "@/components/events/EventRail";
import { ImpactPanel } from "@/components/intelligence/ImpactPanel";
import { AskNexus } from "@/components/intelligence/AskNexus";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CapabilitiesSection } from "@/components/sections/CapabilitiesSection";
import { StatementSection } from "@/components/sections/StatementSection";
import { PredictionSection } from "@/components/sections/PredictionSection";
import { AudienceSection } from "@/components/sections/AudienceSection";
import { ClosingSection } from "@/components/sections/ClosingSection";
import { DOMAIN_LABELS, NEXUS_EVENTS, type Domain, type NexusEvent } from "@/data/events";
import { useLiveEvents } from "@/hooks/use-live-events";

const TITLE = "NEXUS EARTH — The Planet's Intelligent Operating System";
const DESCRIPTION =
  "A live 3D intelligence globe that connects global events to their cascading consequences, with AI impact forecasts and recommended actions for every audience.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NexusEarth,
});

function NexusEarth() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [domain, setDomain] = useState<Domain | "all">("all");
  const [tick, setTick] = useState(0);
  const { liveEvents, sources, fetchedAt, error: liveError } = useLiveEvents();

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 20000);
    return () => window.clearInterval(id);
  }, []);

  // Real events from live sources (USGS, GDACS, ReliefWeb) replace the illustrative
  // scenario for any domain they cover, once loaded. Domains with no live source yet
  // (cyber, financial, supply chain, transport, infrastructure, outbreak) stay illustrative.
  const liveDomains = useMemo(() => new Set(liveEvents.map((e) => e.domain)), [liveEvents]);
  const allEvents = useMemo(() => {
    const illustrative = NEXUS_EVENTS.filter((e) => !liveDomains.has(e.domain));
    return [...liveEvents, ...illustrative];
  }, [liveEvents, liveDomains]);

  const ages = useMemo(() => {
    const drift = tick / 3;
    const now = Date.now();
    return Object.fromEntries(
      allEvents.map((e) => [
        e.id,
        e.timestampMs != null ? (now - e.timestampMs) / 60000 : e.detectedMinutesAgo + drift,
      ]),
    ) as Record<string, number>;
  }, [allEvents, tick]);

  const visibleEvents = useMemo(
    () =>
      (domain === "all" ? allEvents : allEvents.filter((e) => e.domain === domain))
        .slice()
        .sort(
          (a, b) => (ages[a.id] ?? a.detectedMinutesAgo) - (ages[b.id] ?? b.detectedMinutesAgo),
        ),
    [allEvents, domain, ages],
  );

  // Pin the selected signal: live refreshes replace the event objects (and sometimes
  // their ids), which used to make the impact panel vanish mid-read. The pinned copy
  // stays until the user picks another signal or closes the panel.
  const [pinnedEvent, setPinnedEvent] = useState<NexusEvent | null>(null);

  const handleSelect = useCallback(
    (id: string) => {
      setSelectedId(id);
      const found = allEvents.find((e) => e.id === id);
      if (found) setPinnedEvent(found);
    },
    [allEvents],
  );

  const handleClose = useCallback(() => {
    setSelectedId(null);
    setPinnedEvent(null);
  }, []);

  const selectedEvent = pinnedEvent;

  const askContext = useMemo(
    () =>
      allEvents
        .slice(0, 10)
        .map(
          (e) =>
            `- [${DOMAIN_LABELS[e.domain]}] ${e.title} (${e.location}, ${e.country}) — ${e.metric}`,
        )
        .join("\n"),
    [allEvents],
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-glass-border glass">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-3">
          <a href="#globe" className="flex items-center gap-2.5">
            <Globe2 className="h-5 w-5 text-primary" aria-hidden="true" />
            <span className="font-display text-sm font-semibold tracking-[0.14em] text-foreground">
              NEXUS EARTH
            </span>
          </a>
          <nav aria-label="Primary" className="hidden items-center gap-6 md:flex">
            {[
              { href: "#domains", label: "Domains" },
              { href: "#prediction", label: "Prediction" },
              { href: "#audiences", label: "Audiences" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-xs uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <ThemeToggle />
        </div>
      </header>

      <main>
        <section id="globe" className="relative overflow-hidden">
          <div className="mx-auto w-full max-w-7xl px-6 pb-10 pt-10 lg:pt-14">
            <div className="max-w-2xl">
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-primary">
                One planet · One intelligence · One response
              </p>
              <h1 className="mt-4 text-4xl font-semibold leading-[1.05] text-foreground sm:text-6xl">
                The planet&apos;s intelligent operating system.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
                An earthquake is never just an earthquake. NEXUS EARTH watches the world&apos;s
                signals in real time and tells you what they will cause — and what to do about it.
              </p>
            </div>

            <div className="mt-10 grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
              <div className="relative h-[420px] min-w-0 overflow-hidden rounded-xl border border-glass-border bg-surface/40 sm:h-[540px] lg:h-[680px]">

                <GlobeStage
                  events={visibleEvents}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                />
                {!selectedEvent && (
                  <p className="pointer-events-none absolute bottom-3 left-1/2 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 rounded-2xl border border-glass-border bg-glass px-3 py-1.5 text-center font-mono text-[10px] leading-snug text-muted-foreground backdrop-blur sm:text-[11px]">
                    Drag to rotate and tilt · scroll to zoom · select a signal for its impact chain
                  </p>
                )}
                <div className="pointer-events-none absolute left-3 right-3 top-3 mx-auto w-fit max-w-[calc(100%-1.5rem)] whitespace-normal break-words rounded-2xl text-center border border-glass-border bg-glass px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground backdrop-blur sm:left-4 sm:right-auto sm:top-4 sm:mx-0">

                  {liveEvents.length > 0 ? (
                    <span className="flex flex-wrap items-center justify-center gap-1.5">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-pulse-dot rounded-full bg-primary" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                      </span>
                      <span className="min-w-0 break-words">
                        Live ·{" "}
                        {(() => {
                          const ok = sources.filter((s) => s.ok).map((s) => s.name);
                          if (ok.length === 0) return "connecting";
                          return ok.length > 3
                            ? `${ok.slice(0, 3).join(", ")} +${ok.length - 3}`
                            : ok.join(", ");
                        })()}
                      </span>

                    </span>
                  ) : liveError ? (
                    "Live feed unavailable — showing illustrative data"
                  ) : (
                    "Connecting to live feed…"
                  )}
                  {fetchedAt && liveEvents.length > 0 && (
                    <span className="ml-2 opacity-60">
                      updated{" "}
                      {new Date(fetchedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex h-[560px] min-w-0 flex-col gap-4 sm:h-[620px] lg:h-[680px]">
                <div className="min-h-0 flex-1">
                  {selectedEvent ? (
                    <ImpactPanel event={selectedEvent} onClose={() => setSelectedId(null)} />
                  ) : (
                    <div className="glass h-full min-h-0 overflow-hidden rounded-xl p-4">
                      <EventRail
                        events={visibleEvents}
                        ages={ages}
                        activeDomain={domain}
                        selectedId={selectedId}
                        onDomainChange={setDomain}
                        onSelect={setSelectedId}
                      />
                    </div>
                  )}
                </div>
                <AskNexus context={askContext} />
              </div>
            </div>
          </div>
        </section>

        <CapabilitiesSection />
        <StatementSection />
        <PredictionSection />
        <AudienceSection />
      </main>

      <ClosingSection />
    </div>
  );
}
