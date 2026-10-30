import { Button } from "@heroui/react";
import DemoDashboard from "./DemoDashboard";
import DemoPhoneFrame from "./DemoPhoneFrame";
import styles from "./mobile-demo.module.css";

/** Same reserved composition as the live demo, without a skeleton or image swap. */
export default function LandingDemoPoster() {
  return (
    <div className={styles.embedded} data-demo-poster>
      <div className={styles.playbackControls} role="group" aria-label="Demonstration playback loading">
        <Button variant="ghost" isDisabled>Pause</Button>
        <Button variant="ghost" isDisabled>Replay</Button>
      </div>
      <div className={styles.previewStage} inert>
        <DemoPhoneFrame label="Rentals dashboard" decorative descriptionId="landing-demo-poster-description">
          <DemoDashboard />
        </DemoPhoneFrame>
      </div>
      <p id="landing-demo-poster-description" className={styles.srDescription}>APT Mobile rental dashboard demonstration. Fictional display data only.</p>
    </div>
  );
}
