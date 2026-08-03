import {
  AlertTriangle,
  Activity,
  ShieldAlert,
  CloudSun,
  HeartHandshake,
  Plane,
  Container,
  LineChart,
  Radio,
} from "lucide-react";

const DOMAINS = [
  { icon: AlertTriangle, name: "Natural disasters", line: "Seismic, storm, flood and fire signals correlated with population and asset exposure." },
  { icon: Activity, name: "Disease outbreaks", line: "Transmission curves, health-system capacity and cross-border spread pressure." },
  { icon: ShieldAlert, name: "Cybersecurity", line: "Intrusion campaigns tracked against the physical systems they can reach." },
  { icon: CloudSun, name: "Climate", line: "Heat, drought, ice and water stress modelled as economic and humanitarian load." },
  { icon: HeartHandshake, name: "Humanitarian", line: "Displacement, food security and cluster capacity in a single operating picture." },
  { icon: Plane, name: "Transportation", line: "Air, rail, road and maritime disruption resolved to journey and freight impact." },
  { icon: Container, name: "Supply chain", line: "Chokepoint to component to shelf, traced across tiers and lead times." },
  { icon: LineChart, name: "Financial risk", line: "Spreads, currencies and commodity curves read as early physical-world stress." },
  { icon: Radio, name: "Infrastructure", line: "Grid, water, telecom and cable failures projected across dependent services." },
];

export function CapabilitiesSection() {
  return (
    <section id="domains" className="mx-auto w-full max-w-7xl px-6 py-24">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">Intelligence domains</p>
      <h2 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
        Nine domains, one correlation engine.
      </h2>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
        Most systems watch one thing well. NEXUS EARTH watches all of them at once, because the
        consequences of an event almost never stay in the domain it started in.
      </p>

      <ul className="mt-12 grid gap-px overflow-hidden rounded-xl border border-glass-border bg-glass-border sm:grid-cols-2 lg:grid-cols-3">
        {DOMAINS.map(({ icon: Icon, name, line }) => (
          <li key={name} className="group bg-background p-6 transition-colors hover:bg-surface-2">
            <Icon
              className="h-5 w-5 text-primary transition-transform duration-300 group-hover:scale-110"
              aria-hidden="true"
            />
            <h3 className="mt-4 text-base font-medium text-foreground">{name}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{line}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
