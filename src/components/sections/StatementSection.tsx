export function StatementSection() {
  return (
    <section className="relative overflow-hidden border-y border-glass-border">
      <div className="pointer-events-none absolute inset-0 starfield" aria-hidden="true" />
      <div className="relative mx-auto w-full max-w-5xl px-6 py-28 text-center">
        <p className="font-display text-3xl font-semibold leading-tight text-foreground sm:text-5xl">
          The world doesn&apos;t suffer from a lack of information.
          <span className="mt-2 block text-muted-foreground">
            It suffers from disconnected information.
          </span>
        </p>
        <p className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-muted-foreground">
          NEXUS EARTH connects the dots before the world feels the impact.
        </p>
        <p className="mt-6 font-mono text-xs uppercase tracking-[0.3em] text-primary">
          One planet · One intelligence · One response
        </p>
      </div>
    </section>
  );
}
