import { lazy, Suspense, useEffect, useState } from "react";

import type { NexusEvent } from "@/data/events";

const NexusGlobe = lazy(() => import("./NexusGlobe"));

interface Props {
  events: NexusEvent[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function GlobeStage({ events, selectedId, onSelect }: Props) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return (
    <div className="relative h-full w-full">
      <div className="pointer-events-none absolute inset-0 starfield" aria-hidden="true" />
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[90px]"
        aria-hidden="true"
      />
      {hydrated ? (
        <Suspense fallback={<GlobeSkeleton />}>
          <NexusGlobe events={events} selectedId={selectedId} onSelect={onSelect} />
        </Suspense>
      ) : (
        <GlobeSkeleton />
      )}
    </div>
  );
}

function GlobeSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center" aria-hidden="true">
      <div className="relative h-[58%] aspect-square rounded-full border border-primary/25 bg-primary/5">
        <div className="absolute inset-6 rounded-full border border-primary/15" />
        <div className="absolute inset-16 rounded-full border border-primary/10" />
        <div className="absolute inset-0 animate-pulse rounded-full bg-primary/5" />
      </div>
    </div>
  );
}
