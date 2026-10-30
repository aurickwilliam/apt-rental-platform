"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";
import Image from "next/image";
import { motion, transform, useScroll, useTransform, type MotionValue } from "motion/react";
import { useLandingDepth } from "@/hooks/use-landing-motion";
import { manageScrollProgress, MANAGE_SCROLL_MAP as mappings, MANAGE_SCROLL_OFFSETS } from "./live-manage-motion";
import styles from "./live-manage-showcase.module.css";

interface ManageScreensProps {
  dashboardOpacity?: MotionValue<number>;
  dashboardX?: MotionValue<number>;
  dashboardY?: MotionValue<number>;
  dashboardScale?: MotionValue<number>;
  chatOpacity?: MotionValue<number>;
  chatX?: MotionValue<number>;
  chatY?: MotionValue<number>;
  chatScale?: MotionValue<number>;
}

function ManageScreens({ dashboardOpacity, dashboardX, dashboardY, dashboardScale, chatOpacity, chatX, chatY, chatScale }: ManageScreensProps) {
  return (
    <>
      <motion.div data-manage-layer="dashboard" className={styles.dashboard} style={{ opacity: dashboardOpacity, x: dashboardX, y: dashboardY, scale: dashboardScale }}>
        <div data-manage-angle="pixel" className={styles.pixelAngle}>
          <Image
            src="/landing/showcase-manage-rental.png"
            alt="Google Pixel showing APT monthly rent, receipts, repairs, and landlord contact"
            width={659}
            height={1390}
            unoptimized
            loading="lazy"
            className={styles.phone}
          />
        </div>
      </motion.div>
      <motion.div data-manage-layer="chat" className={styles.chat} style={{ opacity: chatOpacity, x: chatX, y: chatY, scale: chatScale }}>
        <div data-manage-angle="iphone" className={styles.iphoneAngle}>
          <Image
            src="/landing/showcase-manage-iphone-chat.png"
            alt="iPhone showing an APT tenant-landlord conversation about rental arrangements and maintenance"
            width={675}
            height={1394}
            unoptimized
            loading="lazy"
            className={styles.phone}
          />
        </div>
      </motion.div>
    </>
  );
}

/** All values follow local scroll directly: no timer, spring lag or per-frame React updates. */
function ManageScroll({ target }: { target: RefObject<HTMLDivElement | null> }) {
  const { scrollYProgress } = useScroll({ target, offset: [...MANAGE_SCROLL_OFFSETS] });
  const dashboardOpacity = useTransform(scrollYProgress, mappings.dashboardOpacity.progress, mappings.dashboardOpacity.values);
  const dashboardX = useTransform(scrollYProgress, mappings.dashboardX.progress, mappings.dashboardX.values);
  const dashboardY = useTransform(scrollYProgress, mappings.dashboardY.progress, mappings.dashboardY.values);
  const dashboardScale = useTransform(scrollYProgress, mappings.dashboardScale.progress, mappings.dashboardScale.values);
  const chatOpacity = useTransform(scrollYProgress, mappings.chatOpacity.progress, mappings.chatOpacity.values);
  const chatX = useTransform(scrollYProgress, mappings.chatX.progress, mappings.chatX.values);
  const chatY = useTransform(scrollYProgress, mappings.chatY.progress, mappings.chatY.values);
  const chatScale = useTransform(scrollYProgress, mappings.chatScale.progress, mappings.chatScale.values);

  useLayoutEffect(() => {
    if (!target.current) return;
    // Seed restored/anchor positions before useScroll's first scheduled measurement.
    const { top, height } = target.current.getBoundingClientRect();
    const progress = manageScrollProgress(top, window.innerHeight, height);
    const values = { dashboardOpacity, dashboardX, dashboardY, dashboardScale, chatOpacity, chatX, chatY, chatScale };
    for (const key of Object.keys(values) as (keyof typeof values)[]) {
      values[key].set(transform(progress, mappings[key].progress, mappings[key].values));
    }
  }, [target, dashboardOpacity, dashboardX, dashboardY, dashboardScale, chatOpacity, chatX, chatY, chatScale]);

  return <ManageScreens dashboardOpacity={dashboardOpacity} dashboardX={dashboardX} dashboardY={dashboardY} dashboardScale={dashboardScale} chatOpacity={chatOpacity} chatX={chatX} chatY={chatY} chatScale={chatScale} />;
}

export default function LiveManageShowcase() {
  const target = useRef<HTMLDivElement>(null);
  const depth = useLandingDepth();

  return (
    <div id="live-manage-showcase" ref={target} data-live-manage-showcase className={styles.panel}>
      <noscript><style>{"#live-manage-showcase [data-manage-layer] { opacity: 1 !important; transform: none !important; }"}</style></noscript>
      {depth ? <ManageScroll target={target} /> : <ManageScreens />}
    </div>
  );
}
