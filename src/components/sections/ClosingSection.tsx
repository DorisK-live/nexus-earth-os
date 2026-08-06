import { Globe2 } from "lucide-react";

export function ClosingSection() {
  return (
    <footer className="border-t border-glass-border">
      <div className="mx-auto w-full max-w-7xl px-6 py-20">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <div>
            <h2 className="max-w-lg text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
              Connect the dots before the world feels the impact.
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              NEXUS EARTH is in active development. Explore the live globe above, or ask it
              something the news hasn&apos;t connected yet.
            </p>
          </div>
          <a
            href="#globe"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02]"
          >
            <Globe2 className="h-4 w-4" aria-hidden="true" />
            Return to the globe
          </a>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-glass-border pt-6 sm:flex-row sm:items-start sm:justify-between">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            NEXUS EARTH
          </p>
          <div className="max-w-lg space-y-3 text-xs text-muted-foreground">
            <p>
              All nine domains stream from live public sources — USGS, GDACS, ReliefWeb, WHO, CISA,
              NOAA SWPC, plus ECB reference rates and lane exposure derived from active hazards. One
              shared server feed is pushed to every visitor in real time.
            </p>
            <p className="rounded-md border border-glass-border bg-surface/40 p-3 text-muted-foreground/90">
              <span className="font-semibold text-foreground">Trust disclaimer.</span> NEXUS is a
              decision-support layer, not an authoritative command system. AI analysis, impact
              cascades, and recommended actions are model-generated estimates. Derived signals
              (supply-chain exposure, currency stress, etc.) are heuristics, not confirmed
              operational impact. Event locations and severity labels are inferred automatically and
              may be approximate. Always verify critical information with the original source agency
              before acting.
            </p>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">
            DorisK production. Bringing thoughts to live.
          </p>
        </div>
      </div>
    </footer>
  );
}
