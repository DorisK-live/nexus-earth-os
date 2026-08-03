import { AlertTriangle, Activity, ShieldAlert, CloudSun, HeartHandshake, Plane, Container, LineChart, Radio } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { DOMAIN_LABELS, SEVERITY_COLOR, SEVERITY_LABELS, type Domain, type NexusEvent } from "@/data/events";
import { cn } from "@/lib/utils";

export const DOMAIN_ICONS: Record<Domain, LucideIcon> = {
  disaster: AlertTriangle,
  outbreak: Activity,
  cyber: ShieldAlert,
  climate: CloudSun,
  humanitarian: HeartHandshake,
  transport: Plane,
  supply: Container,
  financial: LineChart,
  infrastructure: Radio,
};

export function formatAge(minutes: number) {
  if (minutes < 60) return `${Math.max(1, Math.round(minutes))}m ago`;
  const hours = minutes / 60;
  if (hours < 24) return `${Math.floor(hours)}h ${Math.round(minutes % 60)}m ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface Props {
  events: NexusEvent[];
  ages: Record<string, number>;
  activeDomain: Domain | "all";
  selectedId: string | null;
  onDomainChange: (domain: Domain | "all") => void;
  onSelect: (id: string) => void;
}

export function EventRail({ events, ages, activeDomain, selectedId, onDomainChange, onSelect }: Props) {
  const domains: (Domain | "all")[] = ["all", ...(Object.keys(DOMAIN_LABELS) as Domain[])];

  return (
    <section aria-label="Live global event stream" className="flex h-full min-h-0 flex-col">
      <header className="flex items-center justify-between gap-3 px-1 pb-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-pulse-dot rounded-full bg-primary" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Live signal stream
          </h2>
        </div>
        <span className="font-mono text-xs text-muted-foreground">{events.length} active</span>
      </header>

      <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label="Filter by domain">
        {domains.map((domain) => (
          <button
            key={domain}
            type="button"
            onClick={() => onDomainChange(domain)}
            aria-pressed={activeDomain === domain}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[11px] transition-colors",
              activeDomain === domain
                ? "border-primary/50 bg-primary/15 text-foreground"
                : "border-border bg-transparent text-muted-foreground hover:border-primary/30 hover:text-foreground",
            )}
          >
            {domain === "all" ? "All domains" : DOMAIN_LABELS[domain]}
          </button>
        ))}
      </div>

      <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {events.map((event) => {
          const Icon = DOMAIN_ICONS[event.domain];
          const selected = event.id === selectedId;
          return (
            <li key={event.id}>
              <button
                type="button"
                onClick={() => onSelect(event.id)}
                aria-current={selected}
                className={cn(
                  "w-full rounded-lg border p-3 text-left transition-all",
                  selected
                    ? "border-primary/60 bg-primary/10"
                    : "border-glass-border bg-surface/60 hover:border-primary/30 hover:bg-surface-2/70",
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                    style={{ backgroundColor: `color-mix(in oklab, ${SEVERITY_COLOR[event.severity]} 18%, transparent)` }}
                  >
                    <Icon
                      className="h-3.5 w-3.5"
                      style={{ color: SEVERITY_COLOR[event.severity] }}
                      aria-hidden="true"
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{event.title}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 font-mono text-[11px] text-muted-foreground">
                      <span>{event.location}</span>
                      <span aria-hidden="true">·</span>
                      <span>{event.metric}</span>
                      <span aria-hidden="true">·</span>
                      <span>{formatAge(ages[event.id] ?? event.detectedMinutesAgo)}</span>
                    </p>
                  </div>
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider"
                    style={{
                      color: SEVERITY_COLOR[event.severity],
                      backgroundColor: `color-mix(in oklab, ${SEVERITY_COLOR[event.severity]} 14%, transparent)`,
                    }}
                  >
                    {SEVERITY_LABELS[event.severity]}
                  </span>
                </div>
              </button>
            </li>
          );
        })}
        {events.length === 0 && (
          <li className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No active signals in this domain right now.
          </li>
        )}
      </ul>
    </section>
  );
}
