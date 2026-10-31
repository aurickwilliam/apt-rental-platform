"use client";

import { motion, type MotionValue } from "motion/react";
import styles from "./mobile-demo.module.css";

interface DemoTouchIndicatorProps {
  values: { x: MotionValue<number>; y: MotionValue<number>; opacity: MotionValue<number>; scale: MotionValue<number> };
}

export default function DemoTouchIndicator({ values }: DemoTouchIndicatorProps) {
  return <motion.span aria-hidden="true" data-demo-touch className={styles.touchIndicator} style={values} />;
}
