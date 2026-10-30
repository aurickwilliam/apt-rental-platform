"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";
import { cancelFrame, frame, useMotionValueEvent, type MotionValue } from "motion/react";
import { getReducedMotion } from "@/lib/reduced-motion";
import { CTA_ACCENT_KEYFRAMES, CTA_BUTTON_KEYFRAMES, CTA_HIGHLIGHT_DURATION, ctaHighlightTransition, type CtaHighlightState } from "./cta-highlight";
import type { JourneyGeometry } from "./journey-geometry";

export function useCtaHighlight(scene: RefObject<HTMLDivElement | null>, progress: MotionValue<number>, geometry: JourneyGeometry) {
  const latch = useRef<CtaHighlightState>("armed");
  const controller = useRef<((value: number) => void) | null>(null);
  useMotionValueEvent(progress, "change", value => controller.current?.(value));
  const { markerDiameter, height, completion: { arrivalProgress, fadeEndProgress } } = geometry;
  useLayoutEffect(() => {
    const cta = scene.current?.querySelector<HTMLElement>("[data-journey-cta]");
    const accents = cta?.querySelector<HTMLElement>("[data-cta-accents]");
    const button = cta?.querySelector<HTMLAnchorElement>('a[href="/browse"]');
    if (!cta || !accents || !button) return;
    cta.style.setProperty("--journey-marker-size", `${markerDiameter}px`);
    let animations: Animation[] = [];
    const cancel = () => {
      for (const animation of animations) animation.cancel();
      animations = [];
    };
    const play = () => {
      if (window.innerWidth < 768 || window.matchMedia("(prefers-reduced-motion: reduce)").matches || getReducedMotion() || document.documentElement.classList.contains("apt-reduce-motion")) return;
      cancel();
      const options: KeyframeAnimationOptions = { duration: CTA_HIGHLIGHT_DURATION, iterations: 1, fill: "none", easing: "ease-in-out" };
      animations = [accents.animate(CTA_ACCENT_KEYFRAMES, options), button.animate(CTA_BUTTON_KEYFRAMES, options)];
      animations[0].id = "journey-cta-accents";
      animations[1].id = "journey-cta-button";
    };
    const update = (value: number) => {
      const next = ctaHighlightTransition(latch.current, value, { arrivalProgress, fadeEndProgress }, height);
      latch.current = next.state;
      if (next.cancel) { cancelFrame(play); cancel(); }
      if (next.play) frame.postRender(play);
    };
    controller.current = update;
    const seed = () => update(progress.get());
    frame.postRender(seed);
    return () => {
      controller.current = null;
      cancelFrame(seed);
      cancelFrame(play);
      cancel();
      cta.style.removeProperty("--journey-marker-size");
    };
  }, [scene, progress, markerDiameter, height, arrivalProgress, fadeEndProgress]);
}
