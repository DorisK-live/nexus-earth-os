import { useEffect, useRef, useState } from "react";

import type { NexusEvent } from "@/data/events";

const POLL_MS = 3 * 60 * 1000; // conservative, low-noise polling cadence across all sources

export interface LiveSourceStatus {
  name: string;
  ok: boolean;
  count: number;
  error?: string;
}

interface LiveEventsState {
  liveEvents: NexusEvent[];
  sources: LiveSourceStatus[];
  fetchedAt: string | null;
  loading: boolean;
  error: string | null;
}

export function useLiveEvents(): LiveEventsState {
  const [state, setState] = useState<LiveEventsState>({
    liveEvents: [],
    sources: [],
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
          sources?: LiveSourceStatus[];
          fetchedAt?: string;
          error?: string;
        };
        if (!mounted.current) return;
        if (!response.ok && !(payload.events && payload.events.length > 0)) {
          setState((s) => ({
            ...s,
            loading: false,
            sources: payload.sources ?? s.sources,
            error: payload.error ?? "Live feed unavailable.",
          }));
          return;
        }
        setState({
          liveEvents: payload.events ?? [],
          sources: payload.sources ?? [],
          fetchedAt: payload.fetchedAt ?? new Date().toISOString(),
          loading: false,
          error: payload.error ?? null,
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
