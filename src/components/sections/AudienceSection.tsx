const AUDIENCES = [
  { who: "Governments", need: "National picture, cross-agency tasking, escalation thresholds." },
  { who: "NGOs", need: "Where need will appear next, and what the binding constraint will be." },
  { who: "Hospitals", need: "Surge windows, supply exposure, staffing pressure ahead of arrival." },
  { who: "Businesses", need: "Which node in your chain breaks, and how many days of cover remain." },
  { who: "Journalists", need: "Verified signals with the connective tissue between them." },
  { who: "Individuals", need: "One clear instruction for your household, your travel, your family." },
];

export function AudienceSection() {
  return (
    <section id="audiences" className="border-t border-glass-border bg-surface/40">
      <div className="mx-auto w-full max-w-7xl px-6 py-24">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
          Same planet, different decisions
        </p>
        <h2 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
          One event. A different answer for everyone it touches.
        </h2>

        <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {AUDIENCES.map((a) => (
            <li key={a.who} className="border-l border-primary/30 pl-4">
              <h3 className="text-base font-medium text-foreground">{a.who}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a.need}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
