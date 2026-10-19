/**
 * Persisted placement for the draggable notifications FAB.
 *
 * Stored as a side (which content edge to hug) plus a viewport-height ratio
 * for the vertical anchor, so the placement survives refresh, navigation,
 * portal switches, and window resizes. One versioned key is shared by both
 * portals (same saved placement everywhere). Pixel math (sidebar width,
 * margins, clamping) lives in the component; this module stays pure and
 * testable by accepting an explicit storage.
 */

export type FabSide = "left" | "right";

export interface FabPlacement {
  side: FabSide;
  /** Bell-center anchor as a fraction of viewport height, clamped 0..1. */
  topRatio: number;
}

export const FAB_STORAGE_KEY = "apt-notifications-fab:v1";

export const FAB_DEFAULT_PLACEMENT: FabPlacement = {
  side: "right",
  topRatio: 0.12,
};

/** Pixels of pointer travel before a press becomes a drag. */
export const FAB_DRAG_THRESHOLD_PX = 6;

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem"> | null | undefined;

function clampRatio(value: number): number {
  if (!Number.isFinite(value)) return FAB_DEFAULT_PLACEMENT.topRatio;
  return Math.min(0.95, Math.max(0.05, value));
}

function normalizeSide(value: unknown): FabSide {
  return value === "left" ? "left" : "right";
}

export function defaultFabPlacement(): FabPlacement {
  return { ...FAB_DEFAULT_PLACEMENT };
}

export function loadFabPlacement(storage?: StorageLike): FabPlacement {
  try {
    const raw = storage?.getItem(FAB_STORAGE_KEY);
    if (!raw) return defaultFabPlacement();
    const parsed = JSON.parse(raw) as Partial<FabPlacement>;
    if (typeof parsed !== "object" || parsed === null) return defaultFabPlacement();
    return {
      side: normalizeSide(parsed.side),
      topRatio: clampRatio(parsed.topRatio as number),
    };
  } catch {
    // Corrupt entry, private mode, or no storage: fall back to default.
    return defaultFabPlacement();
  }
}

export function saveFabPlacement(placement: FabPlacement, storage?: StorageLike): void {
  try {
    storage?.setItem(
      FAB_STORAGE_KEY,
      JSON.stringify({ side: placement.side, topRatio: clampRatio(placement.topRatio) }),
    );
  } catch {
    // Storage unavailable (private mode, SSR): placement simply won't persist.
  }
}

export function clearFabPlacement(storage?: StorageLike): void {
  try {
    storage?.removeItem(FAB_STORAGE_KEY);
  } catch {
    // Nothing to do — absence of a stored value already means default.
  }
}

export function isDefaultFabPlacement(placement: FabPlacement): boolean {
  return (
    placement.side === FAB_DEFAULT_PLACEMENT.side &&
    Math.abs(placement.topRatio - FAB_DEFAULT_PLACEMENT.topRatio) < 1e-9
  );
}

/** Nearest safe edge for a release point; ties keep the current side. */
export function snapSideForRelease(
  clientX: number,
  viewportWidth: number,
  currentSide: FabSide,
): FabSide {
  if (viewportWidth <= 0) return currentSide;
  if (clientX * 2 === viewportWidth) return currentSide;
  return clientX * 2 < viewportWidth ? "left" : "right";
}
