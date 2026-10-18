/**
 * Collision-free resting placement for the draggable notifications FAB.
 *
 * The trigger floats at a viewport edge, so panels that hug the same edge
 * (messages composer, conversation header, contact list, payment footer,
 * browse filter rail) can end up underneath it. Those controls opt in with
 * `data-fab-clearance`; the FAB measures them and this module returns the
 * nearest edge slot that keeps a margin from every marked control — the
 * saved edge when it has room, the opposite edge when it does not, and the
 * least-obscuring slot as a last resort.
 *
 * A route can also hand over a designated parking spot with `data-fab-dock`
 * (the messages conversation header): the trigger then rests inside that
 * surface, right-aligned and centred, instead of floating free.
 *
 * Pure and testable: callers pass viewport geometry plus obstacle rects and
 * receive pixel coordinates. Persistence stays in `notification-fab-position`;
 * the DOM plumbing lives in the FAB component.
 */

import type { FabPlacement, FabSide } from "./notification-fab-position";

export interface FabRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface FabViewport {
  width: number;
  height: number;
}

/**
 * Opt-in marker for controls the resting trigger must not cover. The value is
 * only a label for debugging; the FAB reads the attribute name.
 */
export const FAB_CLEARANCE_ATTR = "data-fab-clearance";

/**
 * Opt-in marker for a surface that provides a parking spot for the trigger
 * (the messages conversation header). When one is visible the trigger rests
 * inside it — right-aligned and vertically centred — and ignores both the
 * saved anchor and the clearance maths, so on that route it can never be
 * left over content the way a free-floating anchor could. The first visible
 * dock in the document wins; pages without one keep the draggable behaviour.
 */
export const FAB_DOCK_ATTR = "data-fab-dock";

/** Trigger diameter in pixels (matches the `size-11` button). */
export const FAB_SIZE_PX = 44;
/** Gap kept between the trigger and the viewport or sidebar edge. */
export const FAB_EDGE_MARGIN_PX = 12;
/** Extra margin kept between the trigger and every marked control. */
export const FAB_CLEARANCE_PX = 12;

export interface FabPlacementRequest {
  viewport: FabViewport;
  /** Rects of every visible `[data-fab-clearance]` control, in viewport space. */
  obstacles: readonly FabRect[];
  /** Rect of the visible `[data-fab-dock]` surface, when the route offers one. */
  dock?: FabRect | null;
  /** Saved side plus vertical anchor the user chose. */
  preferred: FabPlacement;
  /** Left content edge (sidebar width + margin); the trigger never crosses it. */
  minLeft: number;
}

export interface ResolvedFabPlacement {
  side: FabSide;
  topPx: number;
  leftPx: number;
  /** False when even the best edge slot still overlaps a marked control. */
  clear: boolean;
  /** True when the slot comes from a `data-fab-dock` surface, which is pinned. */
  docked: boolean;
}

/** Vertical span the trigger may occupy on either edge. */
interface TopRange {
  min: number;
  max: number;
}

/** Open interval of tops that would overlap a marked control (clearance included). */
interface ForbiddenTops {
  start: number;
  end: number;
}

interface EdgeEvaluation {
  topPx: number;
  leftPx: number;
  clear: boolean;
  /** Pixels of the trigger that would sit over a control; 0 when `clear`. */
  overlap: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function topRange(viewport: FabViewport): TopRange {
  const min = FAB_EDGE_MARGIN_PX;
  return { min, max: Math.max(min, viewport.height - FAB_EDGE_MARGIN_PX - FAB_SIZE_PX) };
}

function leftForSide(side: FabSide, viewport: FabViewport, minLeft: number): number {
  if (side === "left") return Math.max(minLeft, FAB_EDGE_MARGIN_PX);
  return Math.max(minLeft, viewport.width - FAB_EDGE_MARGIN_PX - FAB_SIZE_PX);
}

/**
 * Tops this edge cannot take: a control blocks a top when the clearance-
 * inflated trigger would touch it. The x-range is compared first, so marked
 * controls that do not reach this edge are ignored.
 */
function forbiddenTops(obstacles: readonly FabRect[], leftPx: number): ForbiddenTops[] {
  const rightPx = leftPx + FAB_SIZE_PX;
  const ranges: ForbiddenTops[] = [];
  for (const obstacle of obstacles) {
    const overlapsX =
      obstacle.left - FAB_CLEARANCE_PX < rightPx && obstacle.right + FAB_CLEARANCE_PX > leftPx;
    if (!overlapsX) continue;
    ranges.push({
      start: obstacle.top - FAB_CLEARANCE_PX - FAB_SIZE_PX,
      end: obstacle.bottom + FAB_CLEARANCE_PX,
    });
  }
  return ranges;
}

function isForbidden(topPx: number, ranges: readonly ForbiddenTops[]): boolean {
  return ranges.some((range) => topPx > range.start && topPx < range.end);
}

/**
 * Candidate tops: the preferred anchor, both viewport ends, and the boundary
 * just above and below every control. Overlap only changes at those
 * boundaries, so the best slot on an edge is always one of them.
 */
function candidateTops(
  preferredTop: number,
  ranges: readonly ForbiddenTops[],
  range: TopRange,
): number[] {
  const candidates = [clamp(preferredTop, range.min, range.max), range.min, range.max];
  for (const forbidden of ranges) {
    candidates.push(
      clamp(forbidden.start, range.min, range.max),
      clamp(forbidden.end, range.min, range.max),
    );
  }
  return candidates;
}

/** How many pixels of the trigger would sit over marked controls at this slot. */
function overlapArea(topPx: number, leftPx: number, obstacles: readonly FabRect[]): number {
  const rightPx = leftPx + FAB_SIZE_PX;
  const bottomPx = topPx + FAB_SIZE_PX;
  let area = 0;
  for (const obstacle of obstacles) {
    const width = Math.min(rightPx, obstacle.right) - Math.max(leftPx, obstacle.left);
    const height = Math.min(bottomPx, obstacle.bottom) - Math.max(topPx, obstacle.top);
    if (width > 0 && height > 0) area += width * height;
  }
  return area;
}

function evaluateEdge(
  side: FabSide,
  request: FabPlacementRequest,
  preferredTop: number,
  range: TopRange,
): EdgeEvaluation {
  const leftPx = leftForSide(side, request.viewport, request.minLeft);
  const ranges = forbiddenTops(request.obstacles, leftPx);

  let clearTop: number | null = null;
  let clearDistance = Number.POSITIVE_INFINITY;
  let fallbackTop = clamp(preferredTop, range.min, range.max);
  let fallbackOverlap = Number.POSITIVE_INFINITY;

  for (const topPx of candidateTops(preferredTop, ranges, range)) {
    if (!isForbidden(topPx, ranges)) {
      const distance = Math.abs(topPx - preferredTop);
      if (distance < clearDistance) {
        clearDistance = distance;
        clearTop = topPx;
      }
      continue;
    }
    const overlap = overlapArea(topPx, leftPx, request.obstacles);
    if (overlap < fallbackOverlap) {
      fallbackOverlap = overlap;
      fallbackTop = topPx;
    }
  }

  if (clearTop !== null) return { topPx: clearTop, leftPx, clear: true, overlap: 0 };
  return { topPx: fallbackTop, leftPx, clear: false, overlap: fallbackOverlap };
}

/**
 * Slot inside a `data-fab-dock` surface: right-aligned to the surface's right
 * edge (never left of the content edge) and vertically centred in it, clamped
 * to the viewport. Docks win over the saved anchor and the obstacle maths —
 * the surface is a designated parking spot, clear by definition.
 */
function dockSlot(request: FabPlacementRequest): ResolvedFabPlacement | null {
  const dock = request.dock;
  if (!dock || dock.right <= dock.left || dock.bottom <= dock.top) return null;
  const { viewport } = request;
  if (viewport.width <= 0 || viewport.height <= 0) return null;
  const range = topRange(viewport);
  const minLeft = Math.max(request.minLeft, FAB_EDGE_MARGIN_PX);
  const rightEdge = Math.min(dock.right, viewport.width);
  return {
    side: "right",
    topPx: clamp(dock.top + (dock.bottom - dock.top - FAB_SIZE_PX) / 2, range.min, range.max),
    leftPx: Math.max(rightEdge - FAB_EDGE_MARGIN_PX - FAB_SIZE_PX, minLeft),
    clear: true,
    docked: true,
  };
}

/**
 * Resting slot for the FAB: a `data-fab-dock` surface when the route offers
 * one, otherwise the saved placement when it is already clear, otherwise the
 * nearest slot that clears every marked control. Ties keep the saved side,
 * and a fully blocked viewport returns the least-obscuring slot with
 * `clear: false` rather than stacking the trigger on a primary action.
 */
export function resolveFabPlacement(request: FabPlacementRequest): ResolvedFabPlacement {
  const { viewport, preferred } = request;
  const range = topRange(viewport);

  const docked = dockSlot(request);
  if (docked) return docked;

  // Unmeasured viewport (SSR, hidden tab): the saved anchor alone.
  if (viewport.width <= 0 || viewport.height <= 0) {
    return {
      side: preferred.side,
      topPx: range.min,
      leftPx: Math.max(request.minLeft, FAB_EDGE_MARGIN_PX),
      clear: true,
      docked: false,
    };
  }

  const preferredTop = clamp(preferred.topRatio * viewport.height, range.min, range.max);
  const primary = evaluateEdge(preferred.side, request, preferredTop, range);
  if (primary.clear) {
    return {
      side: preferred.side,
      topPx: primary.topPx,
      leftPx: primary.leftPx,
      clear: true,
      docked: false,
    };
  }

  const otherSide: FabSide = preferred.side === "left" ? "right" : "left";
  const secondary = evaluateEdge(otherSide, request, preferredTop, range);
  if (secondary.clear) {
    return {
      side: otherSide,
      topPx: secondary.topPx,
      leftPx: secondary.leftPx,
      clear: true,
      docked: false,
    };
  }

  // Both edges are covered: hide behind the slot that obscures the least,
  // keeping the saved side on ties.
  if (secondary.overlap < primary.overlap) {
    return {
      side: otherSide,
      topPx: secondary.topPx,
      leftPx: secondary.leftPx,
      clear: false,
      docked: false,
    };
  }
  return {
    side: preferred.side,
    topPx: primary.topPx,
    leftPx: primary.leftPx,
    clear: false,
    docked: false,
  };
}
