import { useMemo, useState } from "react";
import { ChevronDown, ShieldCheck, Users } from "lucide-react";

import type { NexusEvent } from "@/data/events";
import { assessRisk, EVIDENCE_COPY, evidenceClassFor, RISK_BANDS } from "@/lib/intelligence/risk";
import { cn } from "@/lib/utils";

const BAND_CLASS: Record<string, string> = {
  low: "text-muted-foreground",
  moderate: "text-foreground",
  high: "text-severity-high",
  critical: "text-severity-critical",
};

interface Props {
  event: NexusEvent;
  peers?: NexusEvent[];
  /** Compact mode hides the factor breakdown toggle (used inside dense lists). */
  compact?: boolean;
}

export function RiskCard({ event, peers = [], compact = false }: Props) {
  const risk = useMemo(() => assessRisk(event, peers), [event, peers]);
  const [open, setOpen] = useState(false);
  const evidence = evidenceClassFor(event);

  return (
    <section className="rounded-lg border border-glass-border bg-surface/40 p-3">
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            NEXUS risk score
          </p>
          <p className="mt-1 flex items-baseline gap-2">
            <span
              className={cn(
                "text-2xl font-semibold tabular-nums",
                BAND_CLASS[risk.band] ?? "text-foreground",
              )}
            >
              {risk.score}
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              {RISK_BANDS[risk.band].label} · {RISK_BANDS[risk.band].range}
            </span>
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Confidence
          </p>
          <p className="font-mono text-[11px] text-foreground">
            {risk.confidenceLabel} · {Math.round(risk.confidence * 100)}%
          </p>
        </div>
      </div>

      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500"
          style={{ width: `${risk.score}%` }}
        />
      </div>

      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{risk.explanation}</p>

      <ul className="mt-3 space-y-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
        <li className="flex items-center gap-1.5">
          <ShieldCheck className="h-3 w-3" aria-hidden="true" />
          {EVIDENCE_COPY[evidence]}
        </li>
        <li className="flex items-center gap-1.5">
          <Users className="h-3 w-3" aria-hidden="true" />
          {risk.exposureMillions > 0
            ? `≈${risk.exposureMillions}M people within 250 km (estimate)`
            : "No major urban centre within 250 km"}
          {risk.nearestCity ? ` · nearest ${risk.nearestCity.name} ${risk.nearestCity.km} km` : ""}
        </li>
      </ul>

      {risk.secondaryHazards.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs leading-relaxed text-muted-foreground">
          {risk.secondaryHazards.map((hazard) => (
            <li key={hazard} className="flex gap-2">
              <span className="text-primary">→</span>
              <span>{hazard}</span>
            </li>
          ))}
        </ul>
      )}

      {!compact && (
        <>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="mt-3 flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-primary"
          >
            How this score was calculated
            <ChevronDown
              className={cn("h-3 w-3 transition-transform", open && "rotate-180")}
              aria-hidden="true"
            />
          </button>
          {open && (
            <ul className="mt-2 space-y-1.5 border-t border-glass-border pt-2 text-xs text-muted-foreground">
              {risk.factors.map((factor) => (
                <li key={factor.label} className="flex items-start justify-between gap-3">
                  <span>
                    <span className="text-foreground">{factor.label}</span> — {factor.detail}
                  </span>
                  <span className="shrink-0 font-mono tabular-nums">
                    {factor.points >= 0 ? "+" : ""}
                    {factor.points}
                  </span>
                </li>
              ))}
              <li className="pt-1 text-[11px]">
                Guidance follows official local authorities and emergency services. NEXUS EARTH is
                not an emergency authority.
              </li>
            </ul>
          )}
        </>
      )}
    </section>
  );
}
