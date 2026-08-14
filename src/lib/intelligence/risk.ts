import type { NexusEvent, Severity } from "@/data/events";
import { distanceKm, MAJOR_HUBS, MAJOR_PORTS } from "@/lib/live-sources/geo";
import { POP_CITIES } from "./population";

/**
 * A transparent, deterministic risk score. Every point is attributed to a named
 * factor so the UI can explain exactly why a number moved — no opaque AI scoring.
 */
export type RiskBand = "low" | "moderate" | "high" | "critical";

export type EvidenceClass = "observed" | "inferred" | "forecast";

export interface RiskFactor {
  label: string;
  points: number;
  detail: string;
}

export interface RiskAssessment {
  score: number;
  band: RiskBand;
  factors: RiskFactor[];
  explanation: string;
  /** 0–1, driven by source verification and corroboration. */
  confidence: number;
  confidenceLabel: "low" | "medium" | "high";
  /** Estimated people in large urban areas within 250 km, in millions. */
  exposureMillions: number;
  nearestCity: { name: string; country: string; km: number } | null;
  corroborations: number;
  secondaryHazards: string[];
}

export const RISK_BANDS: Record<RiskBand, { label: string; range: string }> = {
  low: { label: "Low", range: "0–24" },
  moderate: { label: "Moderate", range: "25–49" },
  high: { label: "High", range: "50–74" },
  critical: { label: "Critical", range: "75–100" },
};

const SEVERITY_POINTS: Record<Severity, number> = {
  critical: 38,
  high: 28,
  moderate: 16,
  watch: 8,
};

function bandFor(score: number): RiskBand {
  if (score >= 75) return "critical";
  if (score >= 50) return "high";
  if (score >= 25) return "moderate";
  return "low";
}

function magnitudeOf(event: NexusEvent): number | null {
  const match = event.metric.match(/\bM\s?(\d(?:\.\d)?)/i) ?? event.title.match(/\bM\s?(\d(?:\.\d)?)/i);
  const value = match?.[1] ? Number(match[1]) : NaN;
  return Number.isFinite(value) ? value : null;
}

/** Rough coastal test: distance to the nearest major port stands in for a coastline. */
function nearestPortKm(event: NexusEvent): number {
  return Math.min(...MAJOR_PORTS.map((p) => distanceKm(p.lat, p.lng, event.lat, event.lng)));
}

function nearestHubKm(event: NexusEvent): number {
  return Math.min(...MAJOR_HUBS.map((p) => distanceKm(p.lat, p.lng, event.lat, event.lng)));
}

function exposure(event: NexusEvent) {
  let millions = 0;
  let nearest: { name: string; country: string; km: number } | null = null;
  for (const city of POP_CITIES) {
    const km = distanceKm(city.lat, city.lng, event.lat, event.lng);
    if (!nearest || km < nearest.km) nearest = { name: city.name, country: city.country, km };
    if (km <= 250) millions += city.pop * (km <= 100 ? 1 : 0.5);
  }
  return { millions, nearest };
}

/** How many other live signals sit within 300 km — independent corroboration. */
function corroborating(event: NexusEvent, all: NexusEvent[]): number {
  return all.filter(
    (other) =>
      other.id !== event.id &&
      other.isLive &&
      distanceKm(other.lat, other.lng, event.lat, event.lng) <= 300,
  ).length;
}

function secondaryHazards(event: NexusEvent, coastalKm: number): string[] {
  const hazards: string[] = [];
  const magnitude = magnitudeOf(event);
  const text = `${event.title} ${event.metric}`.toLowerCase();

  if (event.domain === "disaster" && magnitude != null) {
    if (magnitude >= 6.5 && coastalKm < 250)
      hazards.push("Elevated tsunami potential — consult official tsunami authorities");
    if (magnitude >= 5.5) hazards.push("Landslide and aftershock potential in unstable terrain");
    if (magnitude >= 6) hazards.push("Possible structural and utility damage near the epicentre");
  }
  if (text.includes("flood")) hazards.push("Water contamination and road closure potential");
  if (text.includes("cyclone") || text.includes("storm") || text.includes("hurricane"))
    hazards.push("Storm surge and wind damage potential along the track");
  if (text.includes("fire")) hazards.push("Smoke exposure and air quality degradation downwind");
  if (text.includes("volcan")) hazards.push("Ashfall and aviation disruption potential");
  if (coastalKm < 120) hazards.push("Port operations exposure");
  return hazards.slice(0, 4);
}

export function assessRisk(event: NexusEvent, all: NexusEvent[] = []): RiskAssessment {
  const factors: RiskFactor[] = [];

  factors.push({
    label: "Reported severity",
    points: SEVERITY_POINTS[event.severity],
    detail: `Issuing source classifies this signal as ${event.severity}.`,
  });

  const magnitude = magnitudeOf(event);
  if (magnitude != null) {
    const points = Math.round(Math.max(0, (magnitude - 4) * 5));
    if (points > 0)
      factors.push({
        label: "Event magnitude",
        points,
        detail: `Measured magnitude ${magnitude.toFixed(1)}.`,
      });
  }

  const { millions, nearest } = exposure(event);
  if (millions > 0) {
    factors.push({
      label: "Population exposure",
      points: Math.min(20, Math.round(millions * 0.8)),
      detail: `≈${millions.toFixed(1)}M people in large urban areas within 250 km (estimate).`,
    });
  }

  const coastalKm = nearestPortKm(event);
  if (coastalKm < 250) {
    factors.push({
      label: "Coastal / port proximity",
      points: coastalKm < 100 ? 10 : 5,
      detail: `${Math.round(coastalKm)} km from a major port.`,
    });
  }

  const hubKm = nearestHubKm(event);
  if (hubKm < 200) {
    factors.push({
      label: "Infrastructure exposure",
      points: 5,
      detail: `${Math.round(hubKm)} km from a major transport hub.`,
    });
  }

  const corroborations = corroborating(event, all);
  if (corroborations > 0) {
    factors.push({
      label: "Corroborating signals",
      points: Math.min(8, corroborations * 3),
      detail: `${corroborations} other live signal${corroborations === 1 ? "" : "s"} within 300 km.`,
    });
  }

  const ageHours = event.timestampMs
    ? (Date.now() - event.timestampMs) / 3600000
    : event.detectedMinutesAgo / 60;
  const recency =
    ageHours <= 3 ? 10 : ageHours <= 12 ? 6 : ageHours <= 48 ? 2 : ageHours <= 120 ? 0 : -6;
  factors.push({
    label: "Event recency",
    points: recency,
    detail:
      ageHours < 1
        ? "Detected within the last hour."
        : `Detected ${Math.round(ageHours)} hours ago.`,
  });

  const hazards = secondaryHazards(event, coastalKm);
  if (hazards.length > 0) {
    factors.push({
      label: "Secondary hazard potential",
      points: Math.min(10, hazards.length * 3),
      detail: `${hazards.length} plausible knock-on hazard${hazards.length === 1 ? "" : "s"} identified.`,
    });
  }

  const raw = factors.reduce((sum, f) => sum + f.points, 0);
  const score = Math.max(0, Math.min(100, Math.round(raw)));

  const confidenceRaw =
    (event.verified === false ? 0.35 : 0.7) +
    Math.min(0.2, corroborations * 0.07) +
    (event.sourceUrl ? 0.1 : 0);
  const confidence = Math.min(0.98, Number(confidenceRaw.toFixed(2)));

  const top = [...factors].sort((a, b) => b.points - a.points).slice(0, 3);
  const explanation = `Risk score ${score} driven mainly by ${top
    .map((f) => f.label.toLowerCase())
    .join(", ")}.`;

  return {
    score,
    band: bandFor(score),
    factors,
    explanation,
    confidence,
    confidenceLabel: confidence >= 0.8 ? "high" : confidence >= 0.55 ? "medium" : "low",
    exposureMillions: Number(millions.toFixed(1)),
    nearestCity: nearest ? { ...nearest, km: Math.round(nearest.km) } : null,
    corroborations,
    secondaryHazards: hazards,
  };
}

export function evidenceClassFor(event: NexusEvent): EvidenceClass {
  if (event.verified === false) return "inferred";
  return "observed";
}

export const EVIDENCE_COPY: Record<EvidenceClass, string> = {
  observed: "Observed — reported directly by a trusted source",
  inferred: "Inferred — calculated from available evidence",
  forecast: "Forecast — probability-based assessment",
};
