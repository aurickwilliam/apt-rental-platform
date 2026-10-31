import type { ReactNode } from "react";
import { DEMO_VIEWPORT } from "./demo-data";
import styles from "./mobile-demo.module.css";

interface DemoPhoneFrameProps {
  children: ReactNode;
  label: string;
  descriptionId?: string;
  decorative?: boolean;
}

/** Independent CSS bezel, not an overlay on the flattened marketing screenshot. */
export default function DemoPhoneFrame({ children, label, descriptionId = "demo-description", decorative = false }: DemoPhoneFrameProps) {
  return (
    <div className={styles.phoneSpace} data-demo-frame>
      <div className={styles.phone}>
        <div className={styles.screen} role="region" aria-label={`${label} — fictional mobile demonstration`} aria-describedby={descriptionId}
          aria-hidden={decorative || undefined}
          data-demo-viewport={`${DEMO_VIEWPORT.width}x${DEMO_VIEWPORT.height}`}>
          {children}
        </div>
        <span className={styles.camera} aria-hidden="true" />
      </div>
    </div>
  );
}
