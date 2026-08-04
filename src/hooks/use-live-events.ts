import { useEffect, useRef, useState } from "react";

import type { NexusEvent } from "@/data/events";

const POLL_MS = 3 * 60 * 1000; // USGS feed updates every ~5 min; poll a bit more often than that isn't useful, so 3 min is a reasonable, low-noise cadence.

interface LiveEventsState {
  liveEvents: NexusEvent[];
  fetchedAt: string | null;
  loading: boolean;
  error: string | null;
}

export function useLiveEvents(): LiveEventsState {
  const [state, setState] = useState<LiveEventsState>({
    liveEvents: [],
    fetchedAt: null,
    loading: true,
    error: null,
  });
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    async function load() {
      try {
        const response = await fetch("/api/live-events");
        const payload = (await response.json()) as {
          events?: NexusEvent[];
          fetchedAt?: string;
          error?: string;
        };
        if (!mounted.current) return;
        if (!response.ok || payload.error) {
          setState((s) => ({
            ...s,
            loading: false,
            error: payload.error ?? "Live feed unavailable.",
          }));
          return;
        }
        setState({
          liveEvents: payload.events ?? [],
          fetchedAt: payload.fetchedAt ?? new Date().toISOString(),
          loading: false,
          error: null,
        });
      } catch {
        if (!mounted.current) return;
        setState((s) => ({ ...s, loading: false, error: "Could not reach the live feed." }));
      }
    }

    void load();
    const id = window.setInterval(load, POLL_MS);
    return () => {
      mounted.current = false;
      window.clearInterval(id);
    };
  }, []);

  return state;
}
