import { useEffect, useRef, useState } from "react";
import type {
  Map as LeafletMap,
  LayerGroup,
  TileLayer,
  CircleMarker as LeafletCircleMarker,
} from "leaflet";

import { GLOBE_SEVERITY_COLOR, type NexusEvent } from "@/data/events";

import "leaflet/dist/leaflet.css";

interface Props {
  events: NexusEvent[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

type BaseLayer = "streets" | "satellite";

/**
 * Client-only: Leaflet touches `window`/`document` at import time.
 * Rendered through React.lazy behind a hydration gate in MapStage.
 *
 * Uses free, no-API-key tile providers:
 *  - "streets": OpenStreetMap standard tiles
 *  - "satellite": Esri World Imagery (satellite/landscape view, zoomable like Google Maps satellite mode)
 */
export default function NexusMap({ events, selectedId, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<LayerGroup | null>(null);
  const tileRef = useRef<TileLayer | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const [base, setBase] = useState<BaseLayer>("streets");
  const [ready, setReady] = useState(false);

  // Init map once.
  useEffect(() => {
    let cancelled = false;
    void import("leaflet").then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return;
      leafletRef.current = L;

      const map = L.map(containerRef.current, {
        center: [20, 10],
        zoom: 2.4,
        minZoom: 2,
        maxZoom: 18,
        worldCopyJump: true,
        zoomControl: false,
        attributionControl: true,
      });
      L.control.zoom({ position: "bottomright" }).addTo(map);

      mapRef.current = map;
      markersRef.current = L.layerGroup().addTo(map);
      setReady(true);
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current = null;
      tileRef.current = null;
    };
  }, []);

  // Swap base layer (street vs satellite) without rebuilding the map.
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map || !ready) return;

    tileRef.current?.remove();

    const tile =
      base === "streets"
        ? L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: "&copy; OpenStreetMap contributors",
          })
        : L.tileLayer(
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            {
              maxZoom: 19,
              attribution: "Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics",
            },
          );
    tile.addTo(map);
    tileRef.current = tile;
  }, [base, ready]);

  // Render markers whenever events change.
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    const group = markersRef.current;
    if (!L || !map || !group) return;
    group.clearLayers();

    events.forEach((event) => {
      const color = GLOBE_SEVERITY_COLOR[event.severity];
      const isSelected = event.id === selectedId;
      const radius = isSelected
        ? 11
        : event.severity === "critical"
          ? 9
          : event.severity === "high"
            ? 7.5
            : 6;

      const marker: LeafletCircleMarker = L.circleMarker([event.lat, event.lng], {
        radius,
        color,
        weight: isSelected ? 3 : 1.5,
        fillColor: color,
        fillOpacity: isSelected ? 0.85 : 0.6,
        opacity: 0.95,
      });

      marker.bindTooltip(`${event.title} — ${event.location}`, {
        direction: "top",
        offset: [0, -radius],
        className: "nexus-map-tooltip",
      });

      marker.on("click", () => onSelectRef.current(event.id));
      marker.addTo(group);
    });
  }, [events, selectedId, ready]);

  // Fly to the selected event.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    const event = events.find((e) => e.id === selectedId);
    if (!event) return;
    map.flyTo([event.lat, event.lng], Math.max(map.getZoom(), 5), { duration: 1.1 });
  }, [selectedId, events]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      <div className="absolute right-3 top-3 z-[1000] flex overflow-hidden rounded-lg border border-glass-border bg-glass text-[11px] backdrop-blur">
        {(["streets", "satellite"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setBase(option)}
            className={`px-2.5 py-1.5 font-mono uppercase tracking-wider transition-colors ${
              base === option
                ? "bg-primary/20 text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {option === "streets" ? "Streets" : "Satellite"}
          </button>
        ))}
      </div>
    </div>
  );
}
