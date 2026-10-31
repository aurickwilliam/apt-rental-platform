"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useLandingReducedMotion } from "@/hooks/use-landing-motion";
import { buildJourneyGeometry, JOURNEY_DESKTOP_WIDTH, JOURNEY_READING_LINE, type JourneyGeometry, type JourneyLayout } from "./journey-geometry";
import JourneyPath from "./JourneyPath";
import styles from "./journey.module.css";

interface JourneySceneProps { children: ReactNode }

export default function JourneyScene({ children }: JourneySceneProps) {
  const scene = useRef<HTMLDivElement>(null);
  const reduced = useLandingReducedMotion();
  const [geometry, setGeometry] = useState<JourneyGeometry | null>(null);

  useLayoutEffect(() => {
    const root = scene.current;
    if (!root) return;
    const selectors = ["[data-journey-featured]", "[data-product-chapter=discover]", "[data-product-chapter=manage]", "#how-it-works > div", "[data-journey-cta] h2"];
    const anchors = selectors.map(selector => root.querySelector<HTMLElement>(selector));
    const intro = root.querySelector<HTMLElement>('[data-landing-reveal="thriving-heading"]');
    if (anchors.some(anchor => !anchor) || !intro) return;
    const chapterColumns = anchors.slice(1, 3).flatMap(anchor => Array.from(anchor!.children));
    let frame = 0;
    let disposed = false;
    const measure = () => {
      frame = 0;
      if (disposed) return;
      const bounds = root.getBoundingClientRect();
      const sideSpace = Math.min(bounds.left, document.documentElement.clientWidth - bounds.right);
      const box = (element: Element) => {
        const rect = element.getBoundingClientRect();
        return { top: rect.top - bounds.top, bottom: rect.bottom - bounds.top, left: rect.left - bounds.left, right: rect.right - bounds.left };
      };
      const boxes = anchors.map(anchor => box(anchor!));
      // The real streamed section includes its existing bottom padding. Route
      // from the stable listing content edge, never an animated card/slide.
      boxes[0].bottom -= parseFloat(getComputedStyle(anchors[0]!).paddingBottom) || 0;
      let chapters: JourneyLayout["chapters"];
      if (bounds.width >= JOURNEY_DESKTOP_WIDTH) {
        chapters = {
          discover: { copy: box(anchors[1]!.children[0]), media: box(anchors[1]!.children[1]) },
          manage: { copy: box(anchors[2]!.children[0]), media: box(anchors[2]!.children[1]) },
          introBottom: boxes[1].top - parseFloat(getComputedStyle(anchors[1]!.parentElement!).marginTop),
          introRight: (bounds.width + intro.offsetWidth) / 2,
        };
      }
      const next = buildJourneyGeometry({ width: bounds.width, height: bounds.height,
        featured: boxes[0], discover: boxes[1], manage: boxes[2], workflow: boxes[3], cta: boxes[4], sideSpace, chapters,
        scrollLimit: document.documentElement.scrollHeight - window.innerHeight - (window.scrollY + bounds.top) + window.innerHeight * JOURNEY_READING_LINE });
      setGeometry(previous => previous?.path === next?.path && previous?.width === next?.width && previous?.height === next?.height &&
        previous?.completion.arrivalProgress === next?.completion.arrivalProgress && previous?.completion.fadeEndProgress === next?.completion.fadeEndProgress ? previous : next);
    };
    const schedule = () => {
      if (!disposed && !frame) frame = requestAnimationFrame(measure);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(root);
    for (const anchor of anchors) observer.observe(anchor!);
    for (const column of chapterColumns) observer.observe(column);
    // Streaming changes the featured section's size. Captured image loads and
    // fonts also settle through this one batched layout path, not a scroll handler.
    root.addEventListener("load", schedule, true);
    window.addEventListener("resize", schedule, { passive: true });
    void document.fonts.ready.then(schedule);
    schedule();
    return () => {
      disposed = true;
      observer.disconnect();
      cancelAnimationFrame(frame);
      root.removeEventListener("load", schedule, true);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return (
    <div ref={scene} data-journey-scene className={styles.scene}>
      {geometry && !reduced ? <JourneyPath geometry={geometry} scene={scene} /> : null}
      <div className={styles.referenceContent}>{children}</div>
    </div>
  );
}
