"use client";

import { useRef } from "react";
import { Button } from "@heroui/react";
import DemoPhoneFrame from "./DemoPhoneFrame";
import DemoDashboard from "./DemoDashboard";
import DemoPayments from "./DemoPayments";
import DemoMessages from "./DemoMessages";
import DemoConversation from "./DemoConversation";
import { DEMO_SCREENS, type DemoScreen } from "./demo-data";
import DemoTouchIndicator from "./DemoTouchIndicator";
import { useDemoPlayback } from "./use-demo-playback";
import styles from "./mobile-demo.module.css";

const screens = {
  rentals: DemoDashboard,
  payments: DemoPayments,
  messages: DemoMessages,
  conversation: DemoConversation,
};

interface MobileDemoProps { presentation?: "standalone" | "landing" }

/** One local timeline; screen components and fictional fixtures stay unchanged. */
export default function MobileDemo({ presentation = "standalone" }: MobileDemoProps = {}) {
  const landing = presentation === "landing";
  const previewId = landing ? "landing-mobile-demo" : "mobile-demo-preview";
  const descriptionId = landing ? "landing-mobile-demo-description" : "demo-description";
  const stage = useRef<HTMLDivElement>(null);
  const { state, controller, touch, reduced } = useDemoPlayback(stage);
  const selected: DemoScreen = state.screen;
  const label = DEMO_SCREENS.find((screen) => screen.id === selected)!.label;

  return (
    <div className={landing ? styles.embedded : styles.preview} data-mobile-demo data-demo-presentation={presentation}
      role={landing ? "group" : undefined} aria-label={landing ? "APT Mobile demonstration" : undefined}
      aria-describedby={landing ? descriptionId : undefined}>
      {!landing && <header className={styles.previewHeading}>
        <p className={styles.eyebrow}>APT Mobile · product walkthrough</p>
        <h1>Four screens. The same APT.</h1>
        <p>Android light mode · 412 × 915 logical pixels. Fictional display data only; not device-verified.</p>
      </header>}
      {!landing && <div className={styles.screenControls} role="group" aria-label="Choose a static mobile screen">
        {DEMO_SCREENS.map((screen) => (
          <Button key={screen.id} variant={selected === screen.id ? "primary" : "secondary"}
            aria-pressed={selected === screen.id} aria-controls={previewId}
            onPress={() => controller.select(screen.id)}>
            {screen.label}
          </Button>
        ))}
      </div>}
      <div className={styles.playbackControls} role="group" aria-label="Demonstration playback">
        <Button variant={landing ? "ghost" : "secondary"} isDisabled={reduced} aria-controls={previewId}
          onPress={state.userPaused ? controller.resume : controller.pause}>
          {state.userPaused || reduced ? "Resume" : "Pause"}
        </Button>
        <Button variant={landing ? "ghost" : "secondary"} aria-controls={previewId} onPress={controller.replay}>Replay</Button>
      </div>
      <div id={previewId} ref={stage} className={styles.previewStage}
        data-demo-running={state.running} data-demo-screen-name={selected}
        onWheelCapture={landing ? undefined : controller.pause} onPointerDownCapture={landing ? undefined : controller.pause}
        onFocusCapture={landing ? undefined : controller.pause}>
        <DemoPhoneFrame label={label} descriptionId={descriptionId} decorative={landing}>
          <div className={styles.sceneLayers} aria-hidden={landing || state.running ? true : undefined} inert={landing || state.running}>
            {state.layers.map((layer) => {
              const Screen = screens[layer.screen];
              return <div key={`${state.revision}:${layer.id}`} data-demo-layer={layer.id} className={styles.sceneLayer}
                aria-hidden={layer.screen !== selected ? true : undefined} inert={layer.screen !== selected}><Screen /></div>;
            })}
          </div>
          <DemoTouchIndicator values={touch} />
        </DemoPhoneFrame>
      </div>
      <p className={landing ? styles.srDescription : styles.previewNote} id={descriptionId}>
        {reduced ? "Reduced motion: a static Rentals dashboard. " : "A 29-second walkthrough using fictional data: rental dashboard, payment history and landlord messages. "}
        In-phone controls never send messages or payments. {landing ? "Use Pause or Resume to control the demonstration; Replay starts again." : "Choosing a screen or scrolling inside the phone pauses playback; Resume continues from that screen and Replay starts again."}
      </p>
    </div>
  );
}
