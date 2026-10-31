"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";
import Image from "next/image";
import { motion, transform, useScroll, useTransform, type MotionValue } from "motion/react";
import { useLandingDepth } from "@/hooks/use-landing-motion";
import { discoverScrollProgress, DISCOVER_SCROLL_MAP as mappings, DISCOVER_SCROLL_OFFSETS } from "./landing-motion";
import styles from "./discover-showcase.module.css";

interface DiscoverScreensProps {
  backOpacity?: MotionValue<number>;
  backY?: MotionValue<number>;
  backScale?: MotionValue<number>;
  frontOpacity?: MotionValue<number>;
  frontX?: MotionValue<number>;
  frontY?: MotionValue<number>;
  frontScale?: MotionValue<number>;
}

function DiscoverScreens({ backOpacity, backY, backScale, frontOpacity, frontX, frontY, frontScale }: DiscoverScreensProps) {
  return (
    <>
      <motion.div data-discover-layer="browse" className={styles.laptop} style={{ opacity: backOpacity, y: backY, scale: backScale }}>
        <div data-discover-angle="browse" className={styles.laptopSurface}>
          <Image
            src="/landing/showcase-discover-macbook.png"
            alt="MacBook Pro displaying APT apartment browsing with rental listings and a map"
            width={1867}
            height={1146}
            // Preserve fine UI text instead of applying the default lossy photo optimization.
            unoptimized
            loading="lazy"
            className={styles.screen}
          />
        </div>
      </motion.div>
      <motion.div data-discover-layer="details" className={styles.details} style={{ opacity: frontOpacity, x: frontX, y: frontY, scale: frontScale }}>
        <div data-discover-angle="details" className={styles.detailsSurface}>
          <Image
            src="/landing/showcase-details-layer.png"
            alt="APT property details with photos, rent and move-in costs, and the Apply Now button"
            width={1899}
            height={1073}
            unoptimized
            loading="lazy"
            className={styles.screen}
          />
        </div>
      </motion.div>
    </>
  );
}

/** No elapsed-time animation or spring: pausing/reversing scroll pauses/reverses every value. */
function DiscoverScroll({ target }: { target: RefObject<HTMLDivElement | null> }) {
  const { scrollYProgress } = useScroll({ target, offset: [...DISCOVER_SCROLL_OFFSETS] });
  const backOpacity = useTransform(scrollYProgress, mappings.backOpacity.progress, mappings.backOpacity.values);
  const backY = useTransform(scrollYProgress, mappings.backY.progress, mappings.backY.values);
  const backScale = useTransform(scrollYProgress, mappings.backScale.progress, mappings.backScale.values);
  const frontOpacity = useTransform(scrollYProgress, mappings.frontOpacity.progress, mappings.frontOpacity.values);
  const frontX = useTransform(scrollYProgress, mappings.frontX.progress, mappings.frontX.values);
  const frontY = useTransform(scrollYProgress, mappings.frontY.progress, mappings.frontY.values);
  const frontScale = useTransform(scrollYProgress, mappings.frontScale.progress, mappings.frontScale.values);

  useLayoutEffect(() => {
    if (!target.current) return;
    // Seed the outputs themselves before paint: useScroll's first measurement is frame-scheduled.
    // This avoids flashing hidden screenshots on anchor loads and restored reading positions.
    const { top, height } = target.current.getBoundingClientRect();
    const progress = discoverScrollProgress(top, window.innerHeight, height);
    const values = { backOpacity, backY, backScale, frontOpacity, frontX, frontY, frontScale };
    for (const key of Object.keys(values) as (keyof typeof values)[]) {
      values[key].set(transform(progress, mappings[key].progress, mappings[key].values));
    }
  }, [target, backOpacity, backY, backScale, frontOpacity, frontX, frontY, frontScale]);

  return <DiscoverScreens backOpacity={backOpacity} backY={backY} backScale={backScale} frontOpacity={frontOpacity} frontX={frontX} frontY={frontY} frontScale={frontScale} />;
}

export default function DiscoverShowcase() {
  const target = useRef<HTMLDivElement>(null);
  const depth = useLandingDepth();

  return (
    <div id="discover-showcase" ref={target} data-discover-showcase className={styles.panel}>
      <noscript><style>{"#discover-showcase [data-discover-layer] { opacity: 1 !important; transform: none !important; }"}</style></noscript>
      {depth ? <DiscoverScroll target={target} /> : <DiscoverScreens />}
    </div>
  );
}
