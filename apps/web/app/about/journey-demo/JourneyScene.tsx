"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useLandingReducedMotion } from "@/hooks/use-landing-motion";
import { buildJourneyGeometry, JOURNEY_DESKTOP_WIDTH, JOURNEY_READING_LINE, type JourneyGeometry, type JourneyLayout } from "./journey-geometry";
import JourneyPath from "./JourneyPath";
import styles from "./journey-demo.module.css";

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
    if (anchors.some(anchor => !anchor)) return;
    const intro = root.querySelector<HTMLElement>('[data-landing-reveal="thriving-heading"]');
    if (!intro) return;
    const chapterColumns = anchors.slice(1, 3).flatMap(anchor => Array.from(anchor!.children));
    let frame = 0;
    let disposed = false;
    const measure = () => {
      frame = 0;
      if (disposed) return;
      // These are stable section boxes, not the translated/fading device wrappers.
      // Read together only on layout/size changes, never in a scroll callback.
      const bounds = root.getBoundingClientRect();
      const sideSpace = Math.min(bounds.left, document.documentElement.clientWidth - bounds.right);
      const box = (element: Element) => {
        const rect = element.getBoundingClientRect();
        return { top: rect.top - bounds.top, bottom: rect.bottom - bounds.top, left: rect.left - bounds.left, right: rect.right - bounds.left };
      };
      const boxes = anchors.map(anchor => box(anchor!));
      let chapters: JourneyLayout["chapters"];
      if (bounds.width >= JOURNEY_DESKTOP_WIDTH) {
        // Only stable grid columns are measured, not translated text/device children.
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
    // Fluid typography can resize copy while the media-led article keeps its
    // height. Observe those stable columns too, never their animated children.
    for (const column of chapterColumns) observer.observe(column);
    // Height-only resizes can change the remaining scroll travel without resizing
    // a section. This is a layout listener, never a per-scroll measurement.
    window.addEventListener("resize", schedule, { passive: true });
    void document.fonts.ready.then(schedule);
    schedule();
    return () => { disposed = true; observer.disconnect(); cancelAnimationFrame(frame); window.removeEventListener("resize", schedule); };
  }, []);

  return (
    <div ref={scene} data-journey-scene className={styles.scene}>
      {geometry && !reduced ? <JourneyPath geometry={geometry} scene={scene} /> : null}
      <div className={styles.referenceContent}>{children}</div>
    </div>
  );
}
