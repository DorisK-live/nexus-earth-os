import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
import { DOMAIN_LABELS, NEXUS_EVENTS, type Domain } from "@/data/events";

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

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 20000);
    return () => window.clearInterval(id);
  }, []);

  const ages = useMemo(() => {
    const drift = tick / 3;
    return Object.fromEntries(
      NEXUS_EVENTS.map((e) => [e.id, e.detectedMinutesAgo + drift]),
    ) as Record<string, number>;
  }, [tick]);

  const visibleEvents = useMemo(
    () =>
      (domain === "all" ? NEXUS_EVENTS : NEXUS_EVENTS.filter((e) => e.domain === domain))
        .slice()
        .sort((a, b) => a.detectedMinutesAgo - b.detectedMinutesAgo),
    [domain],
  );

  const selectedEvent = useMemo(
    () => NEXUS_EVENTS.find((e) => e.id === selectedId) ?? null,
    [selectedId],
  );

  const askContext = useMemo(
    () =>
      NEXUS_EVENTS.slice(0, 10)
        .map((e) => `- [${DOMAIN_LABELS[e.domain]}] ${e.title} (${e.location}, ${e.country}) — ${e.metric}`)
        .join("\n"),
    [],
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

            <div className="mt-10 grid gap-4 lg:grid-cols-[1.55fr_1fr]">
              <div className="relative h-[420px] overflow-hidden rounded-xl border border-glass-border bg-surface/40 sm:h-[540px] lg:h-[680px]">
                <GlobeStage
                  events={visibleEvents}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                />
                {!selectedEvent && (
                  <p className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-glass-border bg-glass px-3 py-1.5 text-center font-mono text-[11px] text-muted-foreground backdrop-blur">
                    Drag to rotate · select a signal for its impact chain
                  </p>
                )}
              </div>

              <div className="flex h-[680px] max-h-[680px] flex-col gap-4 lg:h-[680px]">
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
