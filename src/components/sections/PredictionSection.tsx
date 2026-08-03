const FORECASTS = [
  { label: "Port congestion spreads to secondary hubs", probability: 82, confidence: 74, horizon: "0–72 h" },
  { label: "Regional airline capacity reduced >10%", probability: 64, confidence: 68, horizon: "1–3 days" },
  { label: "Component lead times extend past 20 weeks", probability: 57, confidence: 61, horizon: "2–6 weeks" },
  { label: "Emergency medical stock falls below reserve", probability: 41, confidence: 55, horizon: "1–2 weeks" },
  { label: "Insurance loss estimates revised upward", probability: 88, confidence: 80, horizon: "0–7 days" },
];

export function PredictionSection() {
  return (
    <section id="prediction" className="mx-auto w-full max-w-7xl px-6 py-24">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
            Predictive modelling
          </p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
            Not what happened. What happens next.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Every signal is scored for probability and confidence, projected across hours, days and
            weeks, and translated into a specific recommended action for the people who have to
            decide something today.
          </p>
          <dl className="mt-8 grid grid-cols-3 gap-6">
            {[
              { k: "9", v: "domains correlated" },
              { k: "72 h", v: "forward horizon" },
              { k: "< 60 s", v: "signal to briefing" },
            ].map((stat) => (
              <div key={stat.v}>
                <dt className="font-display text-2xl text-foreground">{stat.k}</dt>
                <dd className="mt-1 text-xs leading-snug text-muted-foreground">{stat.v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="glass rounded-xl p-5">
          <div className="flex items-center justify-between pb-4">
            <h3 className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              Consequence forecast
            </h3>
            <span className="font-mono text-[11px] text-primary">rolling 72 h</span>
          </div>
          <ul className="space-y-4">
            {FORECASTS.map((f) => (
              <li key={f.label}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm text-foreground">{f.label}</p>
                  <span className="shrink-0 font-display text-sm tabular-nums text-foreground">
                    {f.probability}%
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-1000 ease-out"
                    style={{ width: `${f.probability}%` }}
                  />
                </div>
                <p className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  confidence {f.confidence}% · {f.horizon}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
