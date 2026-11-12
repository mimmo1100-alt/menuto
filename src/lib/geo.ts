/** Delivery-area geometry. Points are [lat, lng]. */
export type ZoneGeo = {
  id: string; kind: string; centerLat: number | null; centerLng: number | null; radiusM: number | null;
  polygon: unknown; minOrder: number; fee: number; hidden?: boolean;
};

export function distanceM(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371000, rad = Math.PI / 180;
  const dLat = (bLat - aLat) * rad, dLng = (bLng - aLng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * rad) * Math.cos(bLat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function pointInPolygon(lat: number, lng: number, poly: [number, number][]) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [yi, xi] = poly[i], [yj, xj] = poly[j];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function inZone(z: ZoneGeo, lat: number, lng: number) {
  if (z.kind === "polygon") {
    const p = Array.isArray(z.polygon) ? (z.polygon as [number, number][]) : [];
    return p.length >= 3 && pointInPolygon(lat, lng, p);
  }
  return z.centerLat != null && z.centerLng != null && z.radiusM != null && distanceM(z.centerLat, z.centerLng, lat, lng) <= z.radiusM;
}

/** Where areas overlap, the one with the lowest minimum order wins, then the lowest fee (same rule as GloriaFood). */
export function zoneFor<T extends ZoneGeo>(zones: T[], lat: number, lng: number): T | null {
  const hits = zones.filter((z) => !z.hidden && inZone(z, lat, lng));
  hits.sort((a, b) => a.minOrder - b.minOrder || a.fee - b.fee);
  return hits[0] ?? null;
}
