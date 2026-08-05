import { useEffect, useRef, useState } from "react";

import type { NexusEvent } from "@/data/events";

/** Fallback polling cadence, used only when the live stream can't be established. */
const POLL_MS = 20 * 1000;

export interface LiveSourceStatus {
  name: string;
  ok: boolean;
  count: number;
  error?: string;
}

interface Snapshot {
  events?: NexusEvent[];
  sources?: LiveSourceStatus[];
  fetchedAt?: string;
  error?: string;
}

interface LiveEventsState {
  liveEvents: NexusEvent[];
  sources: LiveSourceStatus[];
  fetchedAt: string | null;
  loading: boolean;
  error: string | null;
  /** True while the shared server stream is pushing updates to this tab. */
  streaming: boolean;
}

export function useLiveEvents(): LiveEventsState {
  const [state, setState] = useState<LiveEventsState>({
    liveEvents: [],
    sources: [],
    fetchedAt: null,
    loading: true,
    error: null,
    streaming: false,
  });
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    let source: EventSource | null = null;
    let pollId: number | null = null;

    const apply = (payload: Snapshot, streaming: boolean) => {
      if (!mounted.current) return;
      setState({
        liveEvents: payload.events ?? [],
        sources: payload.sources ?? [],
        fetchedAt: payload.fetchedAt ?? new Date().toISOString(),
        loading: false,
        error: payload.error ?? null,
        streaming,
      });
    };

    async function poll() {
      try {
        const response = await fetch("/api/live-events");
        const payload = (await response.json()) as Snapshot;
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
        apply(payload, false);
      } catch {
        if (!mounted.current) return;
        setState((s) => ({ ...s, loading: false, error: "Could not reach the live feed." }));
      }
    }

    function startPolling() {
      if (pollId !== null) return;
      void poll();
      pollId = window.setInterval(() => void poll(), POLL_MS);
    }

    function stopPolling() {
      if (pollId === null) return;
      window.clearInterval(pollId);
      pollId = null;
    }

    // One shared server-side feed is pushed to every open tab over SSE, so all
    // visitors see the same signals at the same moment. Polling is the fallback.
    if (typeof window !== "undefined" && "EventSource" in window) {
      source = new EventSource("/api/live-stream");
      source.addEventListener("snapshot", (event) => {
        stopPolling();
        try {
          apply(JSON.parse((event as MessageEvent<string>).data) as Snapshot, true);
        } catch {
          /* ignore malformed frame */
        }
      });
      source.addEventListener("error", () => {
        if (!mounted.current) return;
        setState((s) => ({ ...s, streaming: false }));
        startPolling();
      });
    } else {
      startPolling();
    }

    const onVisible = () => {
      if (document.visibilityState === "visible" && pollId !== null) void poll();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      mounted.current = false;
      source?.close();
      stopPolling();
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, []);

  return state;
}
