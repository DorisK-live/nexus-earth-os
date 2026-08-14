/**
 * Provider registry. Every live adapter is described here once so the data-sources
 * page, the status indicator and future integrations share a single source of truth.
 * Providers that need credentials we don't have are listed as "not configured" —
 * never wired up with placeholder keys.
 */
export interface ProviderMeta {
  /** Must match the `name` reported by the live feed for configured providers. */
  name: string;
  organisation: string;
  coverage: string;
  homepage: string;
  /** "live" adapters are implemented; "planned" ones need credentials we don't hold. */
  state: "live" | "not-configured";
  credential?: string;
}

export const PROVIDERS: ProviderMeta[] = [
  {
    name: "USGS",
    organisation: "U.S. Geological Survey",
    coverage: "Earthquakes and seismic events, worldwide",
    homepage: "https://earthquake.usgs.gov/earthquakes/feed/",
    state: "live",
  },
  {
    name: "GDACS",
    organisation: "UN OCHA / European Commission",
    coverage: "Multi-hazard disaster alerts: floods, cyclones, volcanoes, wildfires",
    homepage: "https://www.gdacs.org/",
    state: "live",
  },
  {
    name: "NWS Alerts",
    organisation: "NOAA National Weather Service",
    coverage: "Severe weather, flood, storm and tsunami warnings (US territories)",
    homepage: "https://www.weather.gov/documentation/services-web-api",
    state: "live",
  },
  {
    name: "Air Quality",
    organisation: "Open-Meteo / Copernicus CAMS",
    coverage: "Urban air quality (European AQI, PM2.5, PM10)",
    homepage: "https://open-meteo.com/en/docs/air-quality-api",
    state: "live",
  },
  {
    name: "ReliefWeb",
    organisation: "UN OCHA",
    coverage: "Humanitarian emergencies and situation reports",
    homepage: "https://reliefweb.int/",
    state: "live",
  },
  {
    name: "WHO",
    organisation: "World Health Organization",
    coverage: "Disease outbreak news",
    homepage: "https://www.who.int/emergencies/disease-outbreak-news",
    state: "live",
  },
  {
    name: "CISA",
    organisation: "U.S. Cybersecurity and Infrastructure Security Agency",
    coverage: "Critical infrastructure and cybersecurity advisories",
    homepage: "https://www.cisa.gov/news-events/cybersecurity-advisories",
    state: "live",
  },
  {
    name: "NOAA SWPC",
    organisation: "NOAA Space Weather Prediction Center",
    coverage: "Geomagnetic storms affecting power grids and navigation",
    homepage: "https://www.swpc.noaa.gov/",
    state: "live",
  },
  {
    name: "ECB FX",
    organisation: "European Central Bank",
    coverage: "Reference exchange rates used for currency stress signals",
    homepage: "https://www.ecb.europa.eu/stats/eurofxref/",
    state: "live",
  },
  {
    name: "Lane exposure (derived)",
    organisation: "NEXUS EARTH",
    coverage: "Computed port and hub exposure — inferred, not agency-reported",
    homepage: "https://www.gdacs.org/",
    state: "live",
  },
  {
    name: "NASA FIRMS",
    organisation: "NASA Fire Information for Resource Management System",
    coverage: "Satellite active-fire detections (VIIRS/MODIS)",
    homepage: "https://firms.modaps.eosdis.nasa.gov/api/",
    state: "not-configured",
    credential: "FIRMS_MAP_KEY",
  },
  {
    name: "Copernicus EMS",
    organisation: "European Commission Copernicus Emergency Management Service",
    coverage: "Rapid mapping activations for major disasters",
    homepage: "https://emergency.copernicus.eu/",
    state: "not-configured",
    credential: "COPERNICUS_API_KEY",
  },
];

export type FeedHealth = "live" | "degraded" | "offline";

export function feedHealth(sources: { ok: boolean }[], hasEvents: boolean): FeedHealth {
  if (sources.length === 0) return hasEvents ? "degraded" : "offline";
  const ok = sources.filter((s) => s.ok).length;
  if (ok === 0) return "offline";
  if (ok < sources.length) return "degraded";
  return "live";
}

export const HEALTH_COPY: Record<FeedHealth, string> = {
  live: "LIVE — providers responding normally",
  degraded: "DEGRADED — one or more providers unavailable",
  offline: "OFFLINE — live intelligence unavailable",
};
