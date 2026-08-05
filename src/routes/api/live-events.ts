import { createFileRoute } from "@tanstack/react-router";

import { getLiveFeed } from "@/lib/live-feed";

export const Route = createFileRoute("/api/live-events")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const snapshot = await getLiveFeed();
          return Response.json(snapshot, { status: snapshot.error ? 502 : 200 });
        } catch (error) {
          return Response.json(
            {
              events: [],
              sources: [],
              fetchedAt: new Date().toISOString(),
              error: error instanceof Error ? error.message : "Live feed unavailable.",
            },
            { status: 502 },
          );
        }
      },
    },
  },
});
