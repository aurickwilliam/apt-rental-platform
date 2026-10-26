// Pure map-search helpers shared by mobile (react-native-maps regions) and web
// (Google Maps bounds). Platform adapters turn a viewport into a BBox; the
// rest of the logic (buffering, refetch decisions, culling, price pills) is
// identical on both.

export interface BBox {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

/**
 * Grow a bbox by `margin` (a fraction of its half-size) on EACH side, so small
 * pans stay inside the queried area and reuse the already-loaded results.
 * 0.25 = 25% buffer per side, ~(1 + 2*margin)^2 of the visible area.
 */
export function expandBBox(bbox: BBox, margin = 0.25): BBox {
  const latBuffer = ((bbox.maxLat - bbox.minLat) / 2) * margin;
  const lngBuffer = ((bbox.maxLng - bbox.minLng) / 2) * margin;
  return {
    minLat: bbox.minLat - latBuffer,
    maxLat: bbox.maxLat + latBuffer,
    minLng: bbox.minLng - lngBuffer,
    maxLng: bbox.maxLng + lngBuffer,
  };
}

/** True when `inner` is fully covered by `outer` (used to skip refetches on small pans). */
export function bboxContains(outer: BBox, inner: BBox): boolean {
  return (
    inner.minLat >= outer.minLat &&
    inner.maxLat <= outer.maxLat &&
    inner.minLng >= outer.minLng &&
    inner.maxLng <= outer.maxLng
  );
}

/**
 * Compact rent label for map price pills (Airbnb-style).
 * 950 -> "₱950", 8500 -> "₱8.5k", 12000 -> "₱12k", 15500 -> "₱15.5k".
 */
export function formatPricePill(rent: number): string {
  if (!Number.isFinite(rent) || rent < 0) return '₱0';
  if (rent < 1000) return `₱${Math.round(rent)}`;
  const k = rent / 1000;
  const rounded = Math.round(k * 10) / 10;
  return `₱${rounded}k`;
}

/**
 * Filter map pins to the currently visible viewport.
 * Selected pin is always kept even if marginally outside (keeps card in sync).
 */
export function filterPinsToVisible<
  T extends { latitude: number; longitude: number; id?: string; selected?: boolean },
>(pins: T[], visible: BBox, opts?: { keepSelected?: boolean }): T[] {
  const keepSelected = opts?.keepSelected ?? true;
  return pins.filter(
    (p) =>
      (keepSelected && p.selected) ||
      (p.latitude >= visible.minLat &&
        p.latitude <= visible.maxLat &&
        p.longitude >= visible.minLng &&
        p.longitude <= visible.maxLng),
  );
}
