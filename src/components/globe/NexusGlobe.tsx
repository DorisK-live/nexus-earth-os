import { useEffect, useMemo, useRef, useState } from "react";

import { GLOBE_SEVERITY_COLOR, type NexusEvent } from "@/data/events";

interface Props {
  events: NexusEvent[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

interface GlobePoint {
  id: string;
  lat: number;
  lng: number;
  color: string;
  size: number;
  label: string;
}

interface GlobeArc {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: [string, string];
}

/**
 * Client-only: react-globe.gl pulls in three.js and touches window at import time.
 * Rendered through React.lazy behind a hydration gate in GlobeStage.
 */
export default function NexusGlobe({ events, selectedId, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<{
    controls: () => { autoRotate: boolean; autoRotateSpeed: number; enableZoom: boolean };
    pointOfView: (pov: { lat: number; lng: number; altitude: number }, ms?: number) => void;
  } | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [Globe, setGlobe] = useState<React.ComponentType<Record<string, unknown>> | null>(null);

  useEffect(() => {
    let active = true;
    void import("react-globe.gl").then((mod) => {
      if (active) setGlobe(() => mod.default as unknown as React.ComponentType<Record<string, unknown>>);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      setSize({ width: el.clientWidth, height: el.clientHeight });
    });
    observer.observe(el);
    setSize({ width: el.clientWidth, height: el.clientHeight });
    return () => observer.disconnect();
  }, []);

  const points = useMemo<GlobePoint[]>(
    () =>
      events.map((event) => ({
        id: event.id,
        lat: event.lat,
        lng: event.lng,
        color: GLOBE_SEVERITY_COLOR[event.severity],
        size: event.severity === "critical" ? 0.9 : event.severity === "high" ? 0.7 : 0.5,
        label: `${event.title} — ${event.location}`,
      })),
    [events],
  );

  const arcs = useMemo<GlobeArc[]>(() => {
    const source = selectedId ? events.filter((e) => e.id === selectedId) : events.slice(0, 8);
    return source.flatMap((event) =>
      event.links.map((link) => ({
        startLat: event.lat,
        startLng: event.lng,
        endLat: link.lat,
        endLng: link.lng,
        color: [GLOBE_SEVERITY_COLOR[event.severity], "rgba(120, 220, 255, 0.05)"] as [string, string],
      })),
    );
  }, [events, selectedId]);

  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;
    const controls = globe.controls();
    controls.autoRotate = !selectedId;
    controls.autoRotateSpeed = 0.35;
  }, [selectedId, Globe]);

  useEffect(() => {
    const globe = globeRef.current;
    if (!globe || !selectedId) return;
    const event = events.find((e) => e.id === selectedId);
    if (!event) return;
    globe.pointOfView({ lat: event.lat, lng: event.lng, altitude: 1.7 }, 1200);
  }, [selectedId, events]);

  if (!Globe || size.width === 0) {
    return <div ref={containerRef} className="h-full w-full" aria-hidden="true" />;
  }

  return (
    <div ref={containerRef} className="h-full w-full">
      <Globe
        ref={globeRef as never}
        width={size.width}
        height={size.height}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl="/globe/earth-day.jpg"

        ambientLightColor="#ffffff"
        ambientLightIntensity={1.4}
        directionalLightColor="#ffffff"
        directionalLightIntensity={2.2}
        pointLightColor="#ffffff"
        pointLightIntensity={1.0}
        pointsData={points}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointAltitude={0.02}
        pointRadius={(d: unknown) => (d as GlobePoint).size * 0.55}
        onPointClick={(d: unknown) => onSelect((d as GlobePoint).id)}
      />
    </div>
  );
}
