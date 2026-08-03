export type Domain =
  | "disaster"
  | "outbreak"
  | "cyber"
  | "climate"
  | "humanitarian"
  | "transport"
  | "supply"
  | "financial"
  | "infrastructure";

export type Severity = "critical" | "high" | "moderate" | "watch";

export interface ImpactLink {
  label: string;
  lat: number;
  lng: number;
}

export interface NexusEvent {
  id: string;
  title: string;
  domain: Domain;
  severity: Severity;
  location: string;
  country: string;
  lat: number;
  lng: number;
  /** Minutes before "now" that the event was detected. */
  detectedMinutesAgo: number;
  source: string;
  summary: string;
  metric: string;
  links: ImpactLink[];
}

export const DOMAIN_LABELS: Record<Domain, string> = {
  disaster: "Natural disaster",
  outbreak: "Disease outbreak",
  cyber: "Cybersecurity",
  climate: "Climate",
  humanitarian: "Humanitarian",
  transport: "Transportation",
  supply: "Supply chain",
  financial: "Financial risk",
  infrastructure: "Infrastructure",
};

export const SEVERITY_LABELS: Record<Severity, string> = {
  critical: "Critical",
  high: "High",
  moderate: "Moderate",
  watch: "Watch",
};

export const SEVERITY_COLOR: Record<Severity, string> = {
  critical: "var(--sev-critical)",
  high: "var(--sev-high)",
  moderate: "var(--sev-moderate)",
  watch: "var(--sev-watch)",
};

export const NEXUS_EVENTS: NexusEvent[] = [
  {
    id: "eq-tohoku",
    title: "M7.4 offshore earthquake, Tōhoku coast",
    domain: "disaster",
    severity: "critical",
    location: "Sendai",
    country: "Japan",
    lat: 38.27,
    lng: 141.9,
    detectedMinutesAgo: 4,
    source: "JMA / USGS",
    metric: "M7.4 · 32 km depth",
    summary:
      "Shallow offshore rupture 118 km east of Sendai. Tsunami advisory issued for the Miyagi and Iwate coasts; two semiconductor fabs report automated shutdowns.",
    links: [
      { label: "Port of Singapore", lat: 1.29, lng: 103.85 },
      { label: "Port of Los Angeles", lat: 33.74, lng: -118.27 },
      { label: "Hsinchu fabs", lat: 24.8, lng: 120.97 },
    ],
  },
  {
    id: "cyber-nordic-grid",
    title: "Coordinated intrusion on Nordic grid operators",
    domain: "cyber",
    severity: "critical",
    location: "Oslo",
    country: "Norway",
    lat: 59.91,
    lng: 10.75,
    detectedMinutesAgo: 11,
    source: "NSM / sector CERT",
    metric: "4 operators · OT network",
    summary:
      "Credential-harvesting campaign moved laterally into operational technology segments at four transmission operators. No load loss yet; manual failover in place.",
    links: [
      { label: "Stockholm", lat: 59.33, lng: 18.07 },
      { label: "Copenhagen", lat: 55.68, lng: 12.57 },
      { label: "Hamburg", lat: 53.55, lng: 9.99 },
    ],
  },
  {
    id: "outbreak-h5-cambodia",
    title: "Cluster of avian influenza cases confirmed",
    domain: "outbreak",
    severity: "high",
    location: "Kampong Cham",
    country: "Cambodia",
    lat: 12.0,
    lng: 105.45,
    detectedMinutesAgo: 38,
    source: "WHO regional office",
    metric: "9 cases · 2 provinces",
    summary:
      "Nine laboratory-confirmed human cases across two provinces with one probable household transmission chain under investigation.",
    links: [
      { label: "Bangkok", lat: 13.76, lng: 100.5 },
      { label: "Ho Chi Minh City", lat: 10.82, lng: 106.63 },
    ],
  },
  {
    id: "climate-sahel-heat",
    title: "Record heat dome persists over the Sahel",
    domain: "climate",
    severity: "high",
    location: "Niamey",
    country: "Niger",
    lat: 13.51,
    lng: 2.13,
    detectedMinutesAgo: 52,
    source: "ECMWF ensemble",
    metric: "47.8 °C · day 9",
    summary:
      "Ninth consecutive day above 46 °C. Grid load at record levels, three regional hospitals reporting heat-illness surge capacity limits.",
    links: [
      { label: "Ouagadougou", lat: 12.37, lng: -1.53 },
      { label: "Bamako", lat: 12.65, lng: -8.0 },
    ],
  },
  {
    id: "transport-suez-queue",
    title: "Convoy backlog building at Suez southern approach",
    domain: "transport",
    severity: "high",
    location: "Suez",
    country: "Egypt",
    lat: 29.97,
    lng: 32.55,
    detectedMinutesAgo: 65,
    source: "AIS aggregate",
    metric: "61 vessels waiting",
    summary:
      "Sixty-one vessels in the southern holding area after a disabled bulk carrier reduced convoy throughput by roughly a third.",
    links: [
      { label: "Rotterdam", lat: 51.95, lng: 4.14 },
      { label: "Jebel Ali", lat: 25.01, lng: 55.06 },
      { label: "Piraeus", lat: 37.94, lng: 23.65 },
    ],
  },
  {
    id: "supply-lithium",
    title: "Lithium refinery outage cuts cathode feedstock",
    domain: "supply",
    severity: "moderate",
    location: "Antofagasta",
    country: "Chile",
    lat: -23.65,
    lng: -70.4,
    detectedMinutesAgo: 88,
    source: "Operator disclosure",
    metric: "-14% monthly output",
    summary:
      "Unplanned maintenance at a major refinery removes an estimated 14% of monthly carbonate output, tightening an already thin spot market.",
    links: [
      { label: "Shenzhen", lat: 22.54, lng: 114.06 },
      { label: "Ulsan", lat: 35.54, lng: 129.31 },
    ],
  },
  {
    id: "financial-emfx",
    title: "Emerging-market currency stress widening",
    domain: "financial",
    severity: "moderate",
    location: "Istanbul",
    country: "Türkiye",
    lat: 41.01,
    lng: 28.98,
    detectedMinutesAgo: 96,
    source: "Cross-market signals",
    metric: "5y CDS +38 bp",
    summary:
      "Sovereign spreads widened for a fourth session as local-currency debt auctions cleared below target and reserve cover slipped.",
    links: [
      { label: "Cairo", lat: 30.04, lng: 31.24 },
      { label: "Johannesburg", lat: -26.2, lng: 28.05 },
    ],
  },
  {
    id: "humanitarian-horn",
    title: "Displacement surge along the Horn corridor",
    domain: "humanitarian",
    severity: "high",
    location: "Dollo Ado",
    country: "Ethiopia",
    lat: 4.16,
    lng: 42.07,
    detectedMinutesAgo: 120,
    source: "Field cluster reports",
    metric: "31,000 arrivals / 10 days",
    summary:
      "Arrivals at three reception sites exceed planned capacity by 40%. Water trucking is the binding constraint before shelter.",
    links: [
      { label: "Mogadishu", lat: 2.05, lng: 45.32 },
      { label: "Nairobi", lat: -1.29, lng: 36.82 },
    ],
  },
  {
    id: "infra-dam-po",
    title: "Reservoir drawdown limits hydropower on the Po basin",
    domain: "infrastructure",
    severity: "moderate",
    location: "Turin",
    country: "Italy",
    lat: 45.07,
    lng: 7.69,
    detectedMinutesAgo: 143,
    source: "Basin authority",
    metric: "Storage 41% of normal",
    summary:
      "Basin storage at 41% of seasonal normal forces derating across run-of-river plants, pushing thermal generation up during peak hours.",
    links: [
      { label: "Milan", lat: 45.46, lng: 9.19 },
      { label: "Lyon", lat: 45.76, lng: 4.84 },
    ],
  },
  {
    id: "disaster-cyclone-bengal",
    title: "Cyclone intensifying in the Bay of Bengal",
    domain: "disaster",
    severity: "critical",
    location: "Bay of Bengal",
    country: "India / Bangladesh",
    lat: 17.5,
    lng: 88.5,
    detectedMinutesAgo: 27,
    source: "IMD / JTWC",
    metric: "Cat 3 · landfall ~40 h",
    summary:
      "Rapid intensification over unusually warm water. Current track places landfall near the Sundarbans in roughly 40 hours.",
    links: [
      { label: "Kolkata", lat: 22.57, lng: 88.36 },
      { label: "Chattogram", lat: 22.36, lng: 91.78 },
      { label: "Dhaka", lat: 23.81, lng: 90.41 },
    ],
  },
  {
    id: "cyber-ransom-health",
    title: "Ransomware locks regional hospital network",
    domain: "cyber",
    severity: "high",
    location: "Valencia",
    country: "Spain",
    lat: 39.47,
    lng: -0.38,
    detectedMinutesAgo: 74,
    source: "National CSIRT",
    metric: "11 sites · EHR offline",
    summary:
      "Electronic health records offline at eleven sites. Ambulance diversion active; imaging and lab systems on paper backup.",
    links: [
      { label: "Madrid", lat: 40.42, lng: -3.7 },
      { label: "Barcelona", lat: 41.39, lng: 2.17 },
    ],
  },
  {
    id: "transport-atc-eu",
    title: "Air traffic flow restrictions across central Europe",
    domain: "transport",
    severity: "moderate",
    location: "Frankfurt",
    country: "Germany",
    lat: 50.11,
    lng: 8.68,
    detectedMinutesAgo: 33,
    source: "Network manager",
    metric: "Avg delay 41 min",
    summary:
      "Convective weather plus a staffing shortfall in one control sector is generating cascading slot delays across the core network.",
    links: [
      { label: "Amsterdam", lat: 52.31, lng: 4.76 },
      { label: "Zürich", lat: 47.45, lng: 8.56 },
      { label: "Vienna", lat: 48.11, lng: 16.57 },
    ],
  },
  {
    id: "climate-atmospheric-river",
    title: "Atmospheric river stalls over the Pacific Northwest",
    domain: "climate",
    severity: "high",
    location: "Portland",
    country: "United States",
    lat: 45.52,
    lng: -122.68,
    detectedMinutesAgo: 58,
    source: "NWS / river forecast",
    metric: "180 mm / 24 h",
    summary:
      "Two river gauges forecast to exceed major flood stage overnight, with rail and interstate segments in the projected inundation zone.",
    links: [
      { label: "Seattle", lat: 47.61, lng: -122.33 },
      { label: "Vancouver", lat: 49.28, lng: -123.12 },
    ],
  },
  {
    id: "outbreak-cholera",
    title: "Cholera transmission accelerating in urban districts",
    domain: "outbreak",
    severity: "high",
    location: "Lusaka",
    country: "Zambia",
    lat: -15.39,
    lng: 28.32,
    detectedMinutesAgo: 165,
    source: "Ministry of health",
    metric: "R≈1.6 · 2,400 cases",
    summary:
      "Case doubling time under seven days in three high-density districts. Oral rehydration stock covers roughly eleven days at current burn.",
    links: [
      { label: "Harare", lat: -17.83, lng: 31.05 },
      { label: "Lilongwe", lat: -13.98, lng: 33.79 },
    ],
  },
  {
    id: "infra-subsea-cable",
    title: "Subsea cable fault reduces Red Sea capacity",
    domain: "infrastructure",
    severity: "high",
    location: "Red Sea",
    country: "International waters",
    lat: 20.2,
    lng: 38.5,
    detectedMinutesAgo: 190,
    source: "Carrier consortium",
    metric: "3 systems degraded",
    summary:
      "Three systems degraded on the Europe–Asia route. Traffic rerouted west, adding measurable latency for financial and cloud workloads.",
    links: [
      { label: "Mumbai", lat: 19.08, lng: 72.88 },
      { label: "Marseille", lat: 43.3, lng: 5.37 },
      { label: "Singapore", lat: 1.29, lng: 103.85 },
    ],
  },
  {
    id: "financial-energy-hedge",
    title: "Gas forward curve inverts on storage revision",
    domain: "financial",
    severity: "watch",
    location: "London",
    country: "United Kingdom",
    lat: 51.51,
    lng: -0.13,
    detectedMinutesAgo: 210,
    source: "Market data",
    metric: "Front-month +9.2%",
    summary:
      "A downward storage revision flipped the front of the curve into backwardation, pressuring industrial hedging programmes.",
    links: [
      { label: "Rotterdam", lat: 51.95, lng: 4.14 },
      { label: "Milan", lat: 45.46, lng: 9.19 },
    ],
  },
  {
    id: "supply-semiconductor",
    title: "Substrate shortage extends automotive lead times",
    domain: "supply",
    severity: "moderate",
    location: "Taipei",
    country: "Taiwan",
    lat: 25.03,
    lng: 121.57,
    detectedMinutesAgo: 240,
    source: "Tier-1 supplier survey",
    metric: "Lead time 26 weeks",
    summary:
      "ABF substrate lead times extended again, with two automotive tier-1 suppliers signalling line-rate reductions next quarter.",
    links: [
      { label: "Stuttgart", lat: 48.78, lng: 9.18 },
      { label: "Detroit", lat: 42.33, lng: -83.05 },
    ],
  },
  {
    id: "disaster-wildfire-nsw",
    title: "Fire complex expands under wind change",
    domain: "disaster",
    severity: "high",
    location: "Blue Mountains",
    country: "Australia",
    lat: -33.71,
    lng: 150.31,
    detectedMinutesAgo: 45,
    source: "State fire service",
    metric: "41,000 ha · 3 fronts",
    summary:
      "A south-westerly change turned the long eastern flank into a running head fire toward two ridge-line communities.",
    links: [
      { label: "Sydney", lat: -33.87, lng: 151.21 },
      { label: "Canberra", lat: -35.28, lng: 149.13 },
    ],
  },
  {
    id: "humanitarian-winter",
    title: "Winterisation gap in high-altitude shelters",
    domain: "humanitarian",
    severity: "moderate",
    location: "Herat",
    country: "Afghanistan",
    lat: 34.35,
    lng: 62.2,
    detectedMinutesAgo: 300,
    source: "Shelter cluster",
    metric: "78,000 people uncovered",
    summary:
      "Funded winterisation kits cover roughly half of assessed need with six weeks until sustained sub-zero conditions.",
    links: [
      { label: "Kabul", lat: 34.53, lng: 69.17 },
      { label: "Mashhad", lat: 36.3, lng: 59.61 },
    ],
  },
  {
    id: "cyber-supply-chain-pkg",
    title: "Malicious package published to a major registry",
    domain: "cyber",
    severity: "moderate",
    location: "San Francisco",
    country: "United States",
    lat: 37.77,
    lng: -122.42,
    detectedMinutesAgo: 19,
    source: "Registry security team",
    metric: "1.2M weekly downloads",
    summary:
      "A widely depended-upon package shipped a post-install payload harvesting CI credentials. Version yanked; rotation advised.",
    links: [
      { label: "Dublin", lat: 53.35, lng: -6.26 },
      { label: "Bengaluru", lat: 12.97, lng: 77.59 },
    ],
  },
  {
    id: "climate-arctic-melt",
    title: "Sea-ice extent tracks below the historical minimum",
    domain: "climate",
    severity: "watch",
    location: "Svalbard",
    country: "Norway",
    lat: 78.22,
    lng: 15.63,
    detectedMinutesAgo: 330,
    source: "Polar observation",
    metric: "-11% vs. 1991–2020",
    summary:
      "Extent tracking 11% below the reference minimum, with implications for northern shipping windows and fisheries access.",
    links: [
      { label: "Murmansk", lat: 68.97, lng: 33.08 },
      { label: "Reykjavík", lat: 64.15, lng: -21.94 },
    ],
  },
  {
    id: "transport-rail-strike",
    title: "National rail action halts freight corridors",
    domain: "transport",
    severity: "moderate",
    location: "Lyon",
    country: "France",
    lat: 45.76,
    lng: 4.84,
    detectedMinutesAgo: 150,
    source: "Operator notice",
    metric: "72 h notice filed",
    summary:
      "Freight paths suspended for 72 hours from Thursday, pushing intermodal volume onto already-congested road corridors.",
    links: [
      { label: "Barcelona", lat: 41.39, lng: 2.17 },
      { label: "Antwerp", lat: 51.26, lng: 4.4 },
    ],
  },
  {
    id: "infra-water-treatment",
    title: "Treatment plant failure triggers boil-water notice",
    domain: "infrastructure",
    severity: "moderate",
    location: "Monterrey",
    country: "Mexico",
    lat: 25.69,
    lng: -100.32,
    detectedMinutesAgo: 105,
    source: "Municipal utility",
    metric: "620,000 residents",
    summary:
      "Clarifier failure at a primary plant leaves roughly 620,000 residents under a precautionary notice for at least four days.",
    links: [
      { label: "Saltillo", lat: 25.42, lng: -101.0 },
      { label: "San Antonio", lat: 29.42, lng: -98.49 },
    ],
  },
  {
    id: "outbreak-measles",
    title: "Measles resurgence in under-vaccinated districts",
    domain: "outbreak",
    severity: "watch",
    location: "Bucharest",
    country: "Romania",
    lat: 44.43,
    lng: 26.1,
    detectedMinutesAgo: 260,
    source: "ECDC signal",
    metric: "Coverage 79%",
    summary:
      "Coverage below the herd-immunity threshold in several districts as confirmed cases rise for a fifth consecutive week.",
    links: [
      { label: "Sofia", lat: 42.7, lng: 23.32 },
      { label: "Budapest", lat: 47.5, lng: 19.04 },
    ],
  },
];
