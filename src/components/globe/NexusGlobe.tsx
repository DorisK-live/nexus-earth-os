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
    controls: () => {
      autoRotate: boolean;
      autoRotateSpeed: number;
      enableZoom: boolean;
      enableRotate: boolean;
      enablePan: boolean;
      enableDamping: boolean;
      dampingFactor: number;
      rotateSpeed: number;
      zoomSpeed: number;
      minPolarAngle: number;
      maxPolarAngle: number;
      minDistance: number;
      maxDistance: number;
      update: () => void;
    };
    pointOfView: (pov: { lat: number; lng: number; altitude: number }, ms?: number) => void;
  } | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [Globe, setGlobe] = useState<React.ComponentType<Record<string, unknown>> | null>(null);

  useEffect(() => {
    let active = true;
    void import("react-globe.gl").then((mod) => {
      if (active)
        setGlobe(() => mod.default as unknown as React.ComponentType<Record<string, unknown>>);
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
        color: [GLOBE_SEVERITY_COLOR[event.severity], "rgba(120, 220, 255, 0.05)"] as [
          string,
          string,
        ],
      })),
    );
  }, [events, selectedId]);

  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;
    const controls = globe.controls();
    // Full orbit freedom: drag to spin and tilt the pole, wheel/pinch to zoom.
    controls.enableRotate = true;
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.12;
    controls.rotateSpeed = 0.6;
    controls.zoomSpeed = 0.8;
    controls.minPolarAngle = 0;
    controls.maxPolarAngle = Math.PI;
    controls.minDistance = 140;
    controls.maxDistance = 800;
    controls.autoRotate = !selectedId;
    controls.autoRotateSpeed = 0.35;
    controls.update();
  }, [selectedId, Globe]);

  // Start on a tilted three-quarter view so the sphere reads as a globe, not a disc.
  useEffect(() => {
    const globe = globeRef.current;
    if (!globe || !Globe) return;
    globe.pointOfView({ lat: 22, lng: 10, altitude: 2.3 }, 0);
  }, [Globe]);

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
        bumpImageUrl="/globe/earth-topology.png"

        ambientLightColor="#ffffff"
        ambientLightIntensity={1.4}
        directionalLightColor="#ffffff"
        directionalLightIntensity={2.2}
        pointLightColor="#ffffff"
        pointLightIntensity={1.0}

        atmosphereColor="#a8e6ff"
        atmosphereAltitude={0.25}
        pointsData={points}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointAltitude={0.02}
        pointRadius={(d: unknown) => (d as GlobePoint).size * 0.55}
        pointLabel="label"
        onPointClick={(d: unknown) => onSelect((d as GlobePoint).id)}
        ringsData={points}
        ringLat="lat"
        ringLng="lng"
        ringColor={(d: unknown) => () => (d as GlobePoint).color}
        ringMaxRadius={3.2}
        ringPropagationSpeed={1.4}
        ringRepeatPeriod={2200}
        arcsData={arcs}
        arcColor="color"
        arcAltitudeAutoScale={0.42}
        arcStroke={0.4}
        arcDashLength={0.45}
        arcDashGap={0.9}
        arcDashAnimateTime={2600}
      />
    </div>
  );
}
