# NEXUS EARTH — Phase 1: Cinematic Landing + Live Globe Demo

One planet. One intelligence. One response.

A single, deeply polished public site: a cinematic 3D Earth carrying live-looking global events, with real AI that explains why each event matters and what it likely triggers next. No accounts, no dashboards yet — everything is built so the platform can grow into them.

## What gets built

**1. Hero — the living globe**
- Interactive 3D Earth (react-globe.gl / three.js), auto-rotating, drag to spin, scroll to zoom, click a marker to open it.
- Event markers pulse by severity; glowing arcs connect an event to the regions it impacts (Japan quake → Singapore port → LA airport).
- Dark cinematic space backdrop, atmospheric glow, glassmorphism overlays.
- Headline, subline, single primary CTA. No stock "trusted by" logo wall.

**2. Event stream rail**
- Live-feeling ticker of global events beside the globe: type icon, region, severity, timestamp counting up.
- Filter by domain: disaster, outbreak, cyber, climate, humanitarian, transport, supply chain, financial, infrastructure.
- Clicking an item flies the globe to that event.

**3. Impact chain panel (the core AI moment)**
- Selecting an event opens a glass panel with: what happened, and then AI-generated analysis streamed in live —
  - Why it matters (2–3 sentences)
  - Cascading impacts across sectors, each with a probability and confidence bar
  - A 72-hour timeline of likely developments
  - Recommended actions for four audiences: business, government, NGO, individual
- Real AI (Lovable AI, google/gemini-3.6-flash) called from the server, streaming so the panel fills in visibly.
- Skeleton loading states, graceful error state if the AI is rate limited.

**4. "Ask NEXUS" prompt bar**
- One input: "What happens if a major quake hits Tokyo?" → streamed AI briefing in the same visual language.
- A few suggested prompts so it is never an empty box.

**5. Narrative scroll sections**
- Capability grid (the nine intelligence domains) with animated iconography.
- "Information isn't the problem. Disconnection is." statement section.
- Prediction preview: animated probability/confidence charts.
- Audience strip: governments, NGOs, hospitals, journalists, individuals.
- Closing CTA + minimal footer.

**6. Craft layer**
- Light/dark theme (dark is default and the hero direction).
- Motion: staggered reveals, arc draw-in, counter animations — restrained, no fade-on-everything.
- Fully responsive; the globe degrades to a lighter static-render on small screens for performance.
- Accessibility: keyboard-reachable events, reduced-motion support, real alt text and semantic headings.
- SEO head metadata on the route.

## Data

~24 curated events across all nine domains, hand-written to feel real (plausible magnitudes, coordinates, agencies, timestamps). Stored as typed data in the app and gently animated so the feed evolves while the page is open. Shaped so real feeds (USGS, weather, cyber) can replace it later without touching the UI.

## Technical notes

- TanStack Start; landing lives at `/` (replacing the placeholder).
- Globe rendered client-only (dynamic import behind a hydration gate) so SSR doesn't break on three.js.
- AI runs through a streaming server route at `src/routes/api/analyze.ts` using the AI SDK + Lovable AI Gateway; `LOVABLE_API_KEY` stays server-side. Prompt is constrained so output always fits the impact-chain layout.
- Design tokens (deep space blues, signal cyan/amber/red severity scale, glass surfaces) defined in `src/styles.css` — no hardcoded colors in components.
- Components split into `globe/`, `events/`, `intelligence/`, `sections/` for reuse when dashboards arrive.

## Not in this phase

Auth, org accounts, roles, audit logs, per-module pages, executive dashboards, exports, multilingual — the layout and data model leave room for them.
