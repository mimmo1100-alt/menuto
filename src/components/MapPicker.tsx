"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type * as Leaflet from "leaflet";

export type MapZone = {
  id: string; name: string; color: string; kind: string;
  centerLat: number | null; centerLng: number | null; radiusM: number | null; polygon: [number, number][] | null; hidden?: boolean;
};
export type LatLng = { lat: number; lng: number };

const pinIcon = (L: typeof Leaflet, color = "#c4381f") =>
  L.divIcon({
    className: "",
    html: `<svg width="30" height="40" viewBox="0 0 30 40" aria-hidden="true"><path d="M15 39C15 39 28 24 28 15A13 13 0 1 0 2 15C2 24 15 39 15 39Z" fill="${color}" stroke="#fff" stroke-width="2"/><circle cx="15" cy="15" r="5" fill="#fff"/></svg>`,
    iconSize: [30, 40], iconAnchor: [15, 39],
  });

export function drawZone(L: typeof Leaflet, z: MapZone, opts: Leaflet.PathOptions = {}) {
  const style = { color: z.color, weight: 2, fillOpacity: z.hidden ? 0.04 : 0.15, dashArray: z.hidden ? "4 4" : undefined, ...opts };
  if (z.kind === "polygon") {
    const pts = z.polygon ?? [];
    if (pts.length >= 3) return L.polygon(pts, style);
    return pts.length === 2 ? L.polyline(pts, style) : null; // still being drawn
  }
  if (z.centerLat != null && z.centerLng != null && z.radiusM) return L.circle([z.centerLat, z.centerLng], { radius: z.radiusM, ...style });
  return null;
}

export function tiles(L: typeof Leaflet) {
  return L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  });
}

/** A map where the customer drops a pin on their address. Delivery areas are drawn underneath. */
export default function MapPicker({ center, zones, value, onChange, height = 260, label }: {
  center: LatLng; zones: MapZone[]; value: LatLng | null; onChange: (v: LatLng) => void; height?: number; label: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const marker = useRef<Leaflet.Marker | null>(null);
  const cb = useRef(onChange);
  cb.current = onChange;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !box.current || map.current) return;
      const start = value ?? center;
      const m = L.map(box.current, { zoomControl: true, attributionControl: true }).setView([start.lat, start.lng], value ? 16 : 13);
      tiles(L).addTo(m);
      const shapes = zones.filter((z) => !z.hidden).map((z) => drawZone(L, z)).filter(Boolean) as Leaflet.Layer[];
      shapes.forEach((s) => s.addTo(m));
      L.circleMarker([center.lat, center.lng], { radius: 6, color: "#1c2017", fillColor: "#1c2017", fillOpacity: 1 }).addTo(m);
      const mk = L.marker([start.lat, start.lng], { draggable: true, icon: pinIcon(L), keyboard: true, title: label }).addTo(m);
      mk.on("dragend", () => { const p = mk.getLatLng(); cb.current({ lat: p.lat, lng: p.lng }); });
      m.on("click", (e: Leaflet.LeafletMouseEvent) => { mk.setLatLng(e.latlng); cb.current({ lat: e.latlng.lat, lng: e.latlng.lng }); });
      map.current = m; marker.current = mk;
      if (!value) cb.current(start);
    })();
    return () => { cancelled = true; map.current?.remove(); map.current = null; };
    // the map is built once; later pin moves go through the effect below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!value || !marker.current || !map.current) return;
    const cur = marker.current.getLatLng();
    if (Math.abs(cur.lat - value.lat) > 1e-7 || Math.abs(cur.lng - value.lng) > 1e-7) {
      marker.current.setLatLng([value.lat, value.lng]);
      map.current.setView([value.lat, value.lng], 16);
    }
  }, [value]);

  return <div ref={box} role="application" aria-label={label} style={{ height, width: "100%", borderRadius: 10, overflow: "hidden", border: "1px solid var(--line)" }} />;
}

/** Address → coordinates with OpenStreetMap's Nominatim. Returns null when nothing is found or the service is unreachable. */
export async function geocode(q: string): Promise<LatLng | null> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const j = (await res.json()) as { lat: string; lon: string }[];
    return j[0] ? { lat: Number(j[0].lat), lng: Number(j[0].lon) } : null;
  } catch { return null; }
}
