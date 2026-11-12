"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type * as Leaflet from "leaflet";
import { drawZone, tiles, type LatLng, type MapZone } from "./MapPicker";

const dot = (L: typeof Leaflet, color: string, size = 14) =>
  L.divIcon({ className: "", html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:50%;background:#fff;border:3px solid ${color};box-shadow:0 1px 3px rgba(0,0,0,.4)"></span>`, iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
const home = (L: typeof Leaflet) =>
  L.divIcon({ className: "", html: `<span style="display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:#1c2017;color:#fff;font:700 14px system-ui;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)">R</span>`, iconSize: [28, 28], iconAnchor: [14, 14] });

/** Restaurant pin + delivery areas. The selected area can be reshaped: a circle by its centre and edge handles, a polygon by its corners (click the map to add one). */
export default function ZoneEditorMap({ center, onCenter, zones, selectedId, onZone, label }: {
  center: LatLng; onCenter: (c: LatLng) => void; zones: MapZone[]; selectedId: string | null; onZone: (id: string, patch: Partial<MapZone>) => void; label: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const layer = useRef<Leaflet.LayerGroup | null>(null);
  const Lref = useRef<typeof Leaflet | null>(null);
  const props = useRef({ center, onCenter, zones, selectedId, onZone });
  props.current = { center, onCenter, zones, selectedId, onZone };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !box.current || map.current) return;
      Lref.current = L;
      const m = L.map(box.current).setView([center.lat, center.lng], 13);
      tiles(L).addTo(m);
      layer.current = L.layerGroup().addTo(m);
      m.on("click", (e: Leaflet.LeafletMouseEvent) => {
        const { zones: zs, selectedId: sel, onZone: oz } = props.current;
        const z = zs.find((x) => x.id === sel);
        if (z && z.kind === "polygon") oz(z.id, { polygon: [...(z.polygon ?? []), [e.latlng.lat, e.latlng.lng]] });
      });
      map.current = m;
      redraw();
    })();
    return () => { cancelled = true; map.current?.remove(); map.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { redraw(); }); // cheap: a handful of shapes

  function redraw() {
    const L = Lref.current, g = layer.current;
    if (!L || !g) return;
    g.clearLayers();
    const { center: c, zones: zs, selectedId: sel } = props.current;
    for (const z of zs) {
      const shape = drawZone(L, z, z.id === sel ? { weight: 3, fillOpacity: 0.25 } : { weight: 1.5 });
      if (shape) shape.addTo(g);
    }
    const rm = L.marker([c.lat, c.lng], { draggable: true, icon: home(L), title: label, zIndexOffset: 1000 }).addTo(g);
    rm.on("dragend", () => { const p = rm.getLatLng(); props.current.onCenter({ lat: p.lat, lng: p.lng }); });

    const z = zs.find((x) => x.id === sel);
    if (!z) return;
    if (z.kind === "polygon") {
      (z.polygon ?? []).forEach((pt, i) => {
        const h = L.marker(pt, { draggable: true, icon: dot(L, z.color) }).addTo(g);
        h.on("dragend", () => { const p = h.getLatLng(); const poly = [...(z.polygon ?? [])]; poly[i] = [p.lat, p.lng]; props.current.onZone(z.id, { polygon: poly }); });
        h.on("contextmenu", () => { const poly = (z.polygon ?? []).filter((_, j) => j !== i); props.current.onZone(z.id, { polygon: poly }); });
      });
    } else if (z.centerLat != null && z.centerLng != null && z.radiusM) {
      const cm = L.marker([z.centerLat, z.centerLng], { draggable: true, icon: dot(L, z.color, 16) }).addTo(g);
      cm.on("dragend", () => { const p = cm.getLatLng(); props.current.onZone(z.id, { centerLat: p.lat, centerLng: p.lng }); });
      // edge handle due east of the centre
      const east = L.latLng(z.centerLat, z.centerLng + z.radiusM / (111320 * Math.cos((z.centerLat * Math.PI) / 180)));
      const em = L.marker(east, { draggable: true, icon: dot(L, z.color) }).addTo(g);
      em.on("dragend", () => { const r = Math.round(L.latLng(z.centerLat!, z.centerLng!).distanceTo(em.getLatLng())); props.current.onZone(z.id, { radiusM: Math.max(100, r) }); });
    }
  }

  return <div ref={box} role="application" aria-label={label} style={{ height: 380, width: "100%", borderRadius: 10, overflow: "hidden", border: "1px solid var(--line)" }} />;
}
