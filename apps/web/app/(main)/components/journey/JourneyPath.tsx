"use client";

import { useId, useLayoutEffect, useRef, type RefObject } from "react";
import { cancelFrame, frame, motion, useMotionValue, useMotionValueEvent, useTransform } from "motion/react";
import { IconNavigationFilled } from "@tabler/icons-react";
import { journeyMarkerPoint, journeyMarkerAngle, journeyPathOpacity, journeyScrollProgress, type JourneyGeometry } from "./journey-geometry";
import { useCtaHighlight } from "./use-cta-highlight";
import styles from "./journey.module.css";

interface JourneyPathProps {
  scene: RefObject<HTMLDivElement | null>;
  geometry: JourneyGeometry;
}

export default function JourneyPath({ scene, geometry }: JourneyPathProps) {
  const activePath = useRef<SVGPathElement>(null);
  const marker = useRef<SVGGElement>(null);
  const arrowDirection = useRef<SVGGElement>(null);
  const totalLength = useRef(0);
  // The scene's document position changes only through a layout pass. The
  // scroll handler uses this cache and never measures sections per frame.
  const range = useRef({ top: 0, height: geometry.height, viewport: 1 });
  const clipId = useId();
  const scrollYProgress = useMotionValue(0);
  const draw = useTransform(scrollYProgress, geometry.scrollProgress, geometry.drawProgress);
  const pathOpacity = useTransform(scrollYProgress, progress => journeyPathOpacity(progress, geometry.completion));
  const roofOpacity = useTransform(pathOpacity, opacity => 1 - opacity);
  useCtaHighlight(scene, scrollYProgress, geometry);
  const positionMarker = (progress: number) => {
    if (!activePath.current || !marker.current || !totalLength.current) return;
    const point = journeyMarkerPoint(activePath.current, totalLength.current, progress);
    marker.current.setAttribute("transform", `translate(${point.x} ${point.y})`);
    arrowDirection.current?.setAttribute("transform", `rotate(${journeyMarkerAngle(activePath.current, totalLength.current, progress)})`);
  };
  useMotionValueEvent(draw, "change", positionMarker);
  useLayoutEffect(() => {
    const root = scene.current;
    const path = activePath.current;
    const badge = marker.current;
    if (!root || !path || !badge) return;
    totalLength.current = path.getTotalLength();
    const measure = () => {
      const bounds = root.getBoundingClientRect();
      range.current = { top: bounds.top + window.scrollY, height: bounds.height, viewport: window.innerHeight };
    };
    const update = () => {
      const { top, height, viewport } = range.current;
      scrollYProgress.set(journeyScrollProgress(window.scrollY, top, height, viewport));
    };
    measure();
    update();
    // A remounted scene (reduced-motion toggle, StrictMode) can re-seed the
    // progress it already holds. Motion notifies only on change, so dirty()
    // forces the derived path and marker to recompute instead of staying at
    // the start until the next real scroll event.
    scrollYProgress.dirty();
    // A direct anchor or restored history can apply its scroll after hydration.
    // The listener covers that late scroll; these frames cover its first paint.
    // Neither path measures the page again.
    let settle = 0;
    const afterLayout = () => { update(); if (++settle < 4) frame.read(afterLayout); };
    frame.read(afterLayout);
    const remeasure = () => { measure(); update(); };
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", remeasure, { passive: true });
    window.addEventListener("pageshow", update);
    window.addEventListener("hashchange", update);
    window.addEventListener("popstate", update);
    window.addEventListener("scrollend", update, { passive: true });
    const point = journeyMarkerPoint(path, totalLength.current, draw.get());
    badge.setAttribute("transform", `translate(${point.x} ${point.y})`);
    arrowDirection.current?.setAttribute("transform", `rotate(${journeyMarkerAngle(path, totalLength.current, draw.get())})`);
    // Restored anchors/history must settle through Motion's own render pass.
    // Never manually set derived values/styles: that detaches native bindings.
    let disposed = false;
    const reveal = (attempt: number) => {
      if (disposed) return;
      // Wait for the derived draw value before showing the restored scene.
      if (attempt < 4 && draw.get() === 0 && scrollYProgress.get() > 0) {
        frame.postRender(() => reveal(attempt + 1));
        return;
      }
      positionMarker(draw.get());
      path.ownerSVGElement?.removeAttribute("visibility");
    };
    frame.postRender(() => reveal(0));
    return () => {
      disposed = true;
      cancelFrame(afterLayout);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", remeasure);
      window.removeEventListener("pageshow", update);
      window.removeEventListener("hashchange", update);
      window.removeEventListener("popstate", update);
      window.removeEventListener("scrollend", update);
      totalLength.current = 0;
    };
  }, [scene, geometry, scrollYProgress, draw]);

  const radius = geometry.markerDiameter / 2;
  const start = geometry.points[0];
  const arrowSize = geometry.markerDiameter * 0.62;
  return (
    <svg data-journey-svg data-journey-arrival={geometry.completion.arrivalProgress} data-journey-complete={geometry.completion.fadeEndProgress}
      aria-hidden="true" focusable="false" className={styles.pathLayer}
      viewBox={`0 0 ${geometry.width} ${geometry.height}`} width={geometry.width} height={geometry.height} visibility="hidden">
      <defs><clipPath id={clipId}><circle r={radius - 1.5} /></clipPath></defs>
      <motion.g data-journey-strokes style={{ opacity: pathOpacity }}>
        <path data-journey-track d={geometry.path} fill="none" stroke="var(--brand)" strokeOpacity="0.07" strokeWidth="1.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <motion.path ref={activePath} data-journey-active d={geometry.path} fill="none" stroke="var(--brand)" strokeOpacity="0.75" strokeWidth="1.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" style={{ pathLength: draw }} />
      </motion.g>
      <g ref={marker} data-journey-marker data-marker-size={geometry.markerDiameter} aria-hidden="true" className={styles.marker} transform={`translate(${start.x} ${start.y})`}>
        <circle r={radius - 0.75} fill="#376BF5" stroke="white" strokeWidth="1.5" />
        <motion.g data-journey-navigation style={{ opacity: pathOpacity }}>
          <g ref={arrowDirection} data-journey-direction transform="rotate(180)">
            <IconNavigationFilled x={-arrowSize / 2} y={-arrowSize / 2} width={arrowSize} height={arrowSize} color="white" aria-hidden="true" focusable="false" />
          </g>
        </motion.g>
        <motion.g data-journey-roof clipPath={`url(#${clipId})`} style={{ opacity: roofOpacity }}>
          <image href="/logo/logo.svg" x={-radius} y={-radius} width={geometry.markerDiameter} height={geometry.markerDiameter} preserveAspectRatio="xMidYMid meet" />
        </motion.g>
      </g>
    </svg>
  );
}
