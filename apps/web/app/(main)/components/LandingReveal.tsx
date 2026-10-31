"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { useLandingReducedMotion } from "@/hooks/use-landing-motion";
import { LANDING_EASE, LANDING_REVEAL_DURATION, LANDING_VIEWPORT } from "./landing-motion";
import styles from "./landing-motion.module.css";

interface LandingRevealProps {
  children: ReactNode;
  name: string;
  className?: string;
  delay?: number;
  distance?: number;
  scaleFrom?: number;
  duration?: number;
}

export default function LandingReveal({ children, name, className, delay = 0, distance = 52, scaleFrom = 1, duration }: LandingRevealProps) {
  const reduced = useLandingReducedMotion();

  return (
    <motion.div
      data-landing-reveal={name}
      className={[styles.reveal, className].filter(Boolean).join(" ")}
      // The server and first client render use the same starting frame.
      // Animate only toward the final state, never reset visible content to zero.
      initial={{ opacity: 0, y: distance, scale: scaleFrom }}
      animate={reduced ? { opacity: 1, y: 0, scale: 1 } : undefined}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={LANDING_VIEWPORT}
      transition={reduced ? { duration: 0 } : { duration: duration ?? LANDING_REVEAL_DURATION, delay, ease: LANDING_EASE }}
    >
      {children}
    </motion.div>
  );
}
