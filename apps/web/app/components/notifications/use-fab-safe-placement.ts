"use client";

import { useMemo, useSyncExternalStore } from "react";

import type { FabPlacement } from "@/lib/notification-fab-position";
import {
  FAB_CLEARANCE_ATTR,
  FAB_DOCK_ATTR,
  resolveFabPlacement,
  type FabRect,
  type ResolvedFabPlacement,
} from "@/lib/notification-fab-safe-area";

/** Sidebar collapse broadcasts, the same names `AppSidebar` dispatches. */
const SIDEBAR_TOGGLE_EVENTS = [
  "tenant-sidebar-collapsed-change",
  "landlord-sidebar-collapsed-change",
  "admin-sidebar-collapsed-change",
] as const;

const SCROLL_OPTIONS = { capture: true, passive: true } as const;
const EMPTY_KEY = "";

interface FabGeometry {
  width: number;
  height: number;
  obstacles: FabRect[];
  /** First visible `[data-fab-dock]` surface, when the route offers one. */
  dock: FabRect | null;
}

const EMPTY_GEOMETRY: FabGeometry = { width: 0, height: 0, obstacles: [], dock: null };

const listeners = new Set<() => void>();
const observedElements = new Set<Element>();
let subscriberCount = 0;
let frameId: number | null = null;
let notifiedKey: string | null = null;
let resizeObserver: ResizeObserver | null = null;
let mutationObserver: MutationObserver | null = null;
let cachedKey = EMPTY_KEY;
let cachedGeometry: FabGeometry = EMPTY_GEOMETRY;

function measureRect(element: Element): FabRect | null {
  const rect = element.getBoundingClientRect();
  // Zero-sized elements (hidden breakpoints, collapsed panels) are not surface.
  if (rect.width <= 0 || rect.height <= 0) return null;
  return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
}

function measureGeometry(): FabGeometry {
  if (typeof window === "undefined" || typeof document === "undefined") return EMPTY_GEOMETRY;
  const obstacles: FabRect[] = [];
  document.querySelectorAll(`[${FAB_CLEARANCE_ATTR}]`).forEach((element) => {
    const rect = measureRect(element);
    if (rect) obstacles.push(rect);
  });
  const dockRects = Array.from(document.querySelectorAll(`[${FAB_DOCK_ATTR}]`), measureRect).filter(
    (rect): rect is FabRect => rect !== null,
  );
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    obstacles,
    dock: dockRects[0] ?? null,
  };
}

/** Value key for a measurement, rounded to whole pixels. */
function geometryKey(geometry: FabGeometry): string {
  let key = `${Math.round(geometry.width)}x${Math.round(geometry.height)}`;
  for (const rect of geometry.obstacles) {
    key += `|${Math.round(rect.left)},${Math.round(rect.top)},${Math.round(rect.right)},${Math.round(rect.bottom)}`;
  }
  if (geometry.dock) {
    key += `|dock:${Math.round(geometry.dock.left)},${Math.round(geometry.dock.top)},${Math.round(geometry.dock.right)},${Math.round(geometry.dock.bottom)}`;
  }
  return key;
}

/**
 * Fresh measurement, memoized by value so React sees a stable snapshot:
 * `useSyncExternalStore` re-renders only when the key actually changes.
 */
function readGeometry(): FabGeometry {
  const geometry = measureGeometry();
  const key = geometryKey(geometry);
  if (key !== cachedKey) {
    cachedKey = key;
    cachedGeometry = geometry;
  }
  return cachedGeometry;
}

/** Coalesce a burst of signals (scroll, resize, mutations) into one update. */
function notifyWhenChanged(): void {
  if (frameId !== null || typeof window === "undefined") return;
  frameId = window.requestAnimationFrame(() => {
    frameId = null;
    const key = geometryKey(readGeometry());
    if (key === notifiedKey) return;
    notifiedKey = key;
    listeners.forEach((listener) => listener());
  });
}

function refreshObservedElements(): void {
  if (!resizeObserver) return;
  observedElements.forEach((element) => {
    if (element.isConnected) return;
    resizeObserver?.unobserve(element);
    observedElements.delete(element);
  });
  document
    .querySelectorAll(`[${FAB_CLEARANCE_ATTR}], [${FAB_DOCK_ATTR}]`)
    .forEach((element) => {
      if (observedElements.has(element)) return;
      observedElements.add(element);
      resizeObserver?.observe(element);
    });
}

function onGeometrySignal(): void {
  refreshObservedElements();
  notifyWhenChanged();
}

/**
 * Geometry store for the FAB. Resize and sidebar events catch layout changes,
 * the resize observers catch a marked control growing (a staged-attachment
 * strip, a wrapped header), scrolling catches sticky controls moving, and the
 * mutation observer catches controls mounted by the next route plus clearance
 * and dock attributes flipping on an element that stays mounted.
 */
function subscribeFabGeometry(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  subscriberCount += 1;
  if (subscriberCount === 1) {
    window.addEventListener("resize", onGeometrySignal);
    window.addEventListener("storage", onGeometrySignal);
    window.addEventListener("scroll", onGeometrySignal, SCROLL_OPTIONS);
    for (const name of SIDEBAR_TOGGLE_EVENTS) window.addEventListener(name, onGeometrySignal);
    if (typeof ResizeObserver === "function") {
      resizeObserver = new ResizeObserver(onGeometrySignal);
      resizeObserver.observe(document.documentElement);
    }
    if (typeof MutationObserver === "function") {
      mutationObserver = new MutationObserver(onGeometrySignal);
      mutationObserver.observe(document.body, {
        attributes: true,
        attributeFilter: [FAB_CLEARANCE_ATTR, FAB_DOCK_ATTR],
        childList: true,
        subtree: true,
      });
    }
    refreshObservedElements();
  }
  return () => {
    listeners.delete(onStoreChange);
    subscriberCount = Math.max(0, subscriberCount - 1);
    if (subscriberCount > 0) return;
    window.removeEventListener("resize", onGeometrySignal);
    window.removeEventListener("storage", onGeometrySignal);
    window.removeEventListener("scroll", onGeometrySignal, SCROLL_OPTIONS);
    for (const name of SIDEBAR_TOGGLE_EVENTS) window.removeEventListener(name, onGeometrySignal);
    resizeObserver?.disconnect();
    resizeObserver = null;
    mutationObserver?.disconnect();
    mutationObserver = null;
    observedElements.clear();
    if (frameId !== null) {
      window.cancelAnimationFrame(frameId);
      frameId = null;
    }
    notifiedKey = null;
  };
}

function readServerGeometry(): FabGeometry {
  return EMPTY_GEOMETRY;
}

/**
 * Resting slot for the FAB: it parks inside a `[data-fab-dock]` surface when
 * the route offers one (the messages conversation header), otherwise the saved
 * placement is nudged to the nearest edge slot that clears every
 * `[data-fab-clearance]` control. The measurement is the single source of
 * truth, so the slot re-resolves on route changes (content mutations),
 * viewport and sidebar changes, scrolling, and when a marked control or dock
 * appears, moves, or grows — never mid-drag, where callers use the live
 * pointer position instead. The saved placement is read-only here: an
 * automatic nudge is page-specific and reverts on the next route.
 */
export function useFabSafePlacement(
  preferred: FabPlacement,
  minLeft: number,
): ResolvedFabPlacement {
  const geometry = useSyncExternalStore(
    subscribeFabGeometry,
    readGeometry,
    readServerGeometry,
  );

  return useMemo(
    () =>
      resolveFabPlacement({
        viewport: { width: geometry.width, height: geometry.height },
        obstacles: geometry.obstacles,
        dock: geometry.dock,
        preferred,
        minLeft,
      }),
    [geometry, preferred, minLeft],
  );
}
