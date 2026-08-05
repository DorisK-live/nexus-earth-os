import { createFileRoute } from "@tanstack/react-router";

import { getLiveFeed } from "@/lib/live-feed";

/** How often the stream re-checks the shared snapshot and pushes changes. */
const TICK_MS = 15 * 1000;
/** Workers cap request duration; the client reconnects transparently. */
const MAX_STREAM_MS = 5 * 60 * 1000;

export const Route = createFileRoute("/api/live-stream")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const encoder = new TextEncoder();

        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            const startedAt = Date.now();
            let lastFetchedAt = "";
            let closed = false;

            const send = (event: string, data: unknown) => {
              if (closed) return;
              controller.enqueue(
                encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
              );
            };

            const close = () => {
              if (closed) return;
              closed = true;
              clearInterval(timer);
              try {
                controller.close();
              } catch {
                /* already closed */
              }
            };

            const push = async () => {
              try {
                const snapshot = await getLiveFeed();
                if (snapshot.fetchedAt !== lastFetchedAt) {
                  lastFetchedAt = snapshot.fetchedAt;
                  send("snapshot", snapshot);
                } else {
                  send("heartbeat", { at: new Date().toISOString() });
                }
              } catch (error) {
                send("snapshot", {
                  events: [],
                  sources: [],
                  fetchedAt: new Date().toISOString(),
                  error: error instanceof Error ? error.message : "Live feed unavailable.",
                });
              }
              if (Date.now() - startedAt > MAX_STREAM_MS) close();
            };

            const timer = setInterval(() => void push(), TICK_MS);
            request.signal.addEventListener("abort", close);
            await push();
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
          },
        });
      },
    },
  },
});
