import { lazy, Suspense, useEffect, useState } from "react";

import type { NexusEvent } from "@/data/events";

const NexusMap = lazy(() => import("./NexusMap"));

interface Props {
  events: NexusEvent[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function MapStage({ events, selectedId, onSelect }: Props) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return (
    <div className="relative h-full w-full">
      {hydrated ? (
        <Suspense fallback={<MapSkeleton />}>
          <NexusMap events={events} selectedId={selectedId} onSelect={onSelect} />
        </Suspense>
      ) : (
        <MapSkeleton />
      )}
    </div>
  );
}

function MapSkeleton() {
  return (
    <div
      className="flex h-full w-full items-center justify-center bg-surface/40"
      aria-hidden="true"
    >
      <div className="h-full w-full animate-pulse bg-[radial-gradient(circle_at_center,var(--surface-2),var(--surface))]" />
    </div>
  );
}
