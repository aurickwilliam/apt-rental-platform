"use client";

import { useId, useLayoutEffect, useRef, type RefObject } from "react";
import { cancelFrame, frame, motion, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { IconNavigationFilled } from "@tabler/icons-react";
import { JOURNEY_READING_LINE, journeyMarkerPoint, journeyMarkerAngle, journeyPathOpacity, type JourneyGeometry } from "./journey-geometry";
import styles from "./journey-demo.module.css";
import { useCtaHighlight } from "./use-cta-highlight";

interface JourneyPathProps {
  scene: RefObject<HTMLDivElement | null>;
  geometry: JourneyGeometry;
}

export default function JourneyPath({ scene, geometry }: JourneyPathProps) {
  const activePath = useRef<SVGPathElement>(null);
  const marker = useRef<SVGGElement>(null);
  const arrowDirection = useRef<SVGGElement>(null);
  const totalLength = useRef(0);
  const clipId = useId();
  const { scrollYProgress } = useScroll({ target: scene, offset: ["start 0.72", "end 0.72"] });
  // Measured section position plus modest arc-distance pacing keeps wide gap
  // sweeps perceptible. The reading line is a reference, not a pinned cursor.
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
    // Cache actual SVG length once for this layout. Only position/tangent lookups happen on scroll.
    totalLength.current = path.getTotalLength();
    const bounds = root.getBoundingClientRect();
    scrollYProgress.set(Math.max(0, Math.min(1, (window.innerHeight * JOURNEY_READING_LINE - bounds.top) / bounds.height)));
    const point = journeyMarkerPoint(path, totalLength.current, draw.get());
    badge.setAttribute("transform", `translate(${point.x} ${point.y})`);
    arrowDirection.current?.setAttribute("transform", `rotate(${journeyMarkerAngle(path, totalLength.current, draw.get())})`);
    // Reveal initial mounts only after Motion's existing render pass has settled
    // the derived layers. Never manually overwrite their styles or Motion values:
    // that can detach native scroll bindings and freeze the completion fade.
    const reveal = () => { path.ownerSVGElement?.removeAttribute("visibility"); };
    frame.postRender(reveal);
    return () => { cancelFrame(reveal); totalLength.current = 0; };
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
