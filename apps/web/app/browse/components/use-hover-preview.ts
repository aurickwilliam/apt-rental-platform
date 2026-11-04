"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { BrowseApartment } from "../lib/fetch-browse-results";
import type { PreviewAnchor } from "@/lib/browse-preview-position";

const HOVER_EXPAND_DELAY_MS = 450;
const HOVER_COLLAPSE_DELAY_MS = 150;

export type HoveredCardRect = PreviewAnchor;

export function previewAnchor(element: HTMLElement): HoveredCardRect {
  const card = element.closest<HTMLElement>("[data-preview-card]") ?? element;
  const rect = card.getBoundingClientRect();
  const bounds = card.closest("[data-browse-preview-bounds]")?.getBoundingClientRect();
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
    bounds: bounds ? { left: bounds.left, right: bounds.right } : undefined,
  };
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

// Shared Netflix-style hover-preview intent: expand after a dwell so casual
// mouse passes never pop the preview, collapse shortly after leave. All
// state updates happen in event handlers and subscription callbacks, never
// synchronously in an effect body.
export function useHoverPreview() {
  const [preview, setPreview] = useState<HoveredCard | null>(null);
  const expandTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const collapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = () => {
    if (expandTimer.current) clearTimeout(expandTimer.current);
    if (collapseTimer.current) clearTimeout(collapseTimer.current);
    expandTimer.current = null;
    collapseTimer.current = null;
  };

  const handleHoverCard = useCallback(
    (apartment: BrowseApartment, rect: HoveredCardRect) => {
      if (!canHoverPreview()) return;
      if (collapseTimer.current) clearTimeout(collapseTimer.current);
      collapseTimer.current = null;
      if (expandTimer.current) clearTimeout(expandTimer.current);
      expandTimer.current = setTimeout(() => {
        setPreview({ apartment, rect });
      }, HOVER_EXPAND_DELAY_MS);
    },
    [],
  );

  const handleLeaveCard = useCallback(() => {
    if (document.activeElement?.closest("[data-browse-preview]")) return;
    if (expandTimer.current) clearTimeout(expandTimer.current);
    expandTimer.current = null;
    if (collapseTimer.current) clearTimeout(collapseTimer.current);
    collapseTimer.current = setTimeout(() => {
      setPreview(null);
    }, HOVER_COLLAPSE_DELAY_MS);
  }, []);

  const handleKeepPreview = useCallback(() => {
    if (collapseTimer.current) clearTimeout(collapseTimer.current);
    collapseTimer.current = null;
  }, []);

  const dismissPreview = useCallback(() => {
    clearTimers();
    setPreview(null);
  }, []);

  // Dismissal subscriptions only: scroll (captured, covers row swipes),
  // resize (position would be stale). The panel owns Escape dismissal.
  useEffect(() => {
    const onScroll = (event: Event) => {
      if (event.target instanceof Element && event.target.closest("[data-browse-preview]")) return;
      dismissPreview();
    };
    const onResize = () => dismissPreview();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
      clearTimers();
    };
  }, [dismissPreview]);

  return {
    preview,
    handleHoverCard,
    handleLeaveCard,
    handleKeepPreview,
    dismissPreview,
  };
}
