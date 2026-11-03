"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { BrowseApartment } from "../lib/fetch-browse-results";

const HOVER_EXPAND_DELAY_MS = 450;
const HOVER_COLLAPSE_DELAY_MS = 150;
// Matches the exit animation in globals.css (.apt-hover-preview[data-closing]).
const PREVIEW_EXIT_MS = 160;
const PREVIEW_WIDTH = 320;
const PREVIEW_ESTIMATED_HEIGHT = 308;
const VIEWPORT_MARGIN = 8;

export interface HoveredCardRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface HoveredCard {
  apartment: BrowseApartment;
  rect: HoveredCardRect;
}

function canHoverPreview(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches
  );
}

export interface PreviewPlacement {
  left: number;
  top: number;
  width: number;
  /** Size of the covered card relative to the preview: the scale it grows from. */
  fromScale: number;
}

export function previewPosition(rect: HoveredCardRect): PreviewPlacement {
  const left = Math.min(
    Math.max(rect.left + rect.width / 2 - PREVIEW_WIDTH / 2, VIEWPORT_MARGIN),
    Math.max(window.innerWidth - PREVIEW_WIDTH - VIEWPORT_MARGIN, VIEWPORT_MARGIN),
  );
  const top = Math.min(
    Math.max(rect.top + rect.height / 2 - PREVIEW_ESTIMATED_HEIGHT / 2, VIEWPORT_MARGIN),
    Math.max(window.innerHeight - PREVIEW_ESTIMATED_HEIGHT - VIEWPORT_MARGIN, VIEWPORT_MARGIN),
  );
  return { left, top, width: PREVIEW_WIDTH, fromScale: Math.min(rect.width / PREVIEW_WIDTH, 1) };
}

// Shared Netflix-style hover-preview intent: expand after a dwell so casual
// mouse passes never pop the preview, collapse shortly after leave. All
// state updates happen in event handlers and subscription callbacks, never
// synchronously in an effect body.
export function useHoverPreview() {
  const [preview, setPreview] = useState<HoveredCard | null>(null);
  // True while the exit animation plays; the preview stays mounted until it ends.
  const [isPreviewClosing, setIsPreviewClosing] = useState(false);
  const expandTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const collapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = () => {
    if (expandTimer.current) clearTimeout(expandTimer.current);
    if (collapseTimer.current) clearTimeout(collapseTimer.current);
    if (exitTimer.current) clearTimeout(exitTimer.current);
    expandTimer.current = null;
    collapseTimer.current = null;
    exitTimer.current = null;
  };

  // Hovering again while the preview is leaving brings it back.
  const cancelExit = () => {
    if (exitTimer.current) clearTimeout(exitTimer.current);
    exitTimer.current = null;
    setIsPreviewClosing(false);
  };

  const handleHoverCard = useCallback(
    (apartment: BrowseApartment, rect: HoveredCardRect) => {
      if (!canHoverPreview()) return;
      if (collapseTimer.current) clearTimeout(collapseTimer.current);
      collapseTimer.current = null;
      if (expandTimer.current) clearTimeout(expandTimer.current);
      expandTimer.current = setTimeout(() => {
        cancelExit();
        setPreview({ apartment, rect });
      }, HOVER_EXPAND_DELAY_MS);
    },
    [],
  );

  const handleLeaveCard = useCallback(() => {
    if (expandTimer.current) clearTimeout(expandTimer.current);
    expandTimer.current = null;
    if (collapseTimer.current) clearTimeout(collapseTimer.current);
    collapseTimer.current = setTimeout(() => {
      setIsPreviewClosing(true);
      exitTimer.current = setTimeout(() => {
        setPreview(null);
        setIsPreviewClosing(false);
      }, PREVIEW_EXIT_MS);
    }, HOVER_COLLAPSE_DELAY_MS);
  }, []);

  const handleKeepPreview = useCallback(() => {
    if (collapseTimer.current) clearTimeout(collapseTimer.current);
    collapseTimer.current = null;
    cancelExit();
  }, []);

  // Immediate: scroll, resize, Escape and navigation have nothing to animate back to.
  const dismissPreview = useCallback(() => {
    clearTimers();
    setPreview(null);
    setIsPreviewClosing(false);
  }, []);

  // Dismissal subscriptions only: scroll (captured, covers row swipes),
  // resize (position would be stale), Escape.
  useEffect(() => {
    const onScroll = () => dismissPreview();
    const onResize = () => dismissPreview();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismissPreview();
    };
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKeyDown);
      clearTimers();
    };
  }, [dismissPreview]);

  return {
    preview,
    isPreviewClosing,
    handleHoverCard,
    handleLeaveCard,
    handleKeepPreview,
    dismissPreview,
  };
}
