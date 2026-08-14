import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { useLiveEvents } from "@/hooks/use-live-events";
import { feedHealth, HEALTH_COPY, PROVIDERS } from "@/lib/providers";

const TITLE = "Data Sources — NEXUS EARTH";
const DESCRIPTION =
  "Every provider behind NEXUS EARTH: official agency feeds, their coverage, live status and last refresh time.";

export const Route = createFileRoute("/sources")({
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
  component: SourcesPage,
});

function SourcesPage() {
  const { sources, fetchedAt, liveEvents } = useLiveEvents();
  const health = feedHealth(sources, liveEvents.length > 0);

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-14">
      <Link
        to="/"
        className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" aria-hidden="true" />
        Back to the globe
      </Link>

      <h1 className="mt-6 text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
        Data sources
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        NEXUS EARTH only displays signals it can attribute to a named provider. Nothing on this
        platform is simulated: when a provider cannot be reached, its data is marked unavailable
        rather than filled in.
      </p>

      <p className="mt-6 rounded-xl border border-glass-border bg-surface/40 p-4 font-mono text-[11px] uppercase tracking-[0.14em] text-foreground">
        {HEALTH_COPY[health]}
        {fetchedAt && (
          <span className="ml-2 text-muted-foreground">
            Updated{" "}
            {new Date(fetchedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </p>

      <ul className="mt-8 space-y-3">
        {PROVIDERS.map((provider) => {
          const status = sources.find((s) => s.name === provider.name);
          const state =
            provider.state === "not-configured"
              ? "Not configured"
              : status
                ? status.ok
                  ? `Responding · ${status.count} signal${status.count === 1 ? "" : "s"}`
                  : "Unavailable"
                : "Awaiting first refresh";

          return (
            <li
              key={provider.name}
              className="rounded-xl border border-glass-border bg-surface/30 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-base font-medium text-foreground">{provider.name}</h2>
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    {provider.organisation}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] ${
                    provider.state === "not-configured"
                      ? "bg-secondary text-muted-foreground"
                      : status?.ok
                        ? "bg-primary/15 text-primary"
                        : "bg-destructive/15 text-destructive"
                  }`}
                >
                  {state}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{provider.coverage}</p>
              {provider.credential && (
                <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  Requires credential {provider.credential} — integration ready, key not supplied
                </p>
              )}
              <a
                href={provider.homepage}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-2 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-primary"
              >
                Provider site
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
