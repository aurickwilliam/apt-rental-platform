import { DEMO_SCREEN_START, sampleDemo } from "./demo-timeline";
import type { DemoScreen } from "./demo-data";

export interface DemoClockDriver {
  play(): void;
  pause(): void;
  seek(time: number): void;
  stop(): void;
}

interface Environment { visible: boolean; documentVisible: boolean; ready: boolean; reduced: boolean }

/** Per-preview local external store, NOT account/global state. Motion owns time;
 * React subscribers are notified only for navigation boundaries or control changes. */
export class DemoPlaybackController {
  private environment: Environment = { visible: false, documentVisible: false, ready: false, reduced: false };
  private userPaused = false;
  private driver: DemoClockDriver | null = null;
  private listeners = new Set<() => void>();
  private time = 0;
  private revision = 0;
  private snapshot = this.createSnapshot();

  private createSnapshot() {
    const frame = sampleDemo(this.time);
    return {
      layers: frame.layers,
      screen: frame.screen,
      layoutKey: frame.layoutKey,
      revision: this.revision,
      userPaused: this.userPaused,
      reduced: this.environment.reduced,
      running: !this.userPaused && !this.environment.reduced && this.environment.visible && this.environment.documentVisible && this.environment.ready,
    };
  }

  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };

  private publish() {
    const next = this.createSnapshot();
    const previous = this.snapshot;
    if (next.layoutKey === previous.layoutKey && next.revision === previous.revision && next.userPaused === previous.userPaused && next.reduced === previous.reduced && next.running === previous.running) return;
    this.snapshot = next;
    if (next.running !== previous.running) {
      if (next.running) this.driver?.play(); else this.driver?.pause();
    }
    this.listeners.forEach((listener) => listener());
  }

  attach(driver: DemoClockDriver) {
    this.driver = driver;
    driver.seek(this.time);
    if (this.snapshot.running) driver.play(); else driver.pause();
    return () => { driver.stop(); if (this.driver === driver) this.driver = null; };
  }

  tick = (time: number) => { this.time = time; this.publish(); };

  setEnvironment(next: Partial<Environment>) {
    const reduceNow = next.reduced === true && !this.environment.reduced;
    this.environment = { ...this.environment, ...next };
    if (reduceNow) { this.userPaused = true; this.reset(0); }
    else this.publish();
  }

  private reset(time: number) {
    this.driver?.pause();
    this.time = time;
    this.revision++;
    this.driver?.seek(time);
    this.publish();
    if (this.snapshot.running) this.driver?.play();
  }

  pause = () => { this.userPaused = true; this.publish(); };
  resume = () => { if (!this.environment.reduced) { this.userPaused = false; this.publish(); } };
  replay = () => { this.userPaused = this.environment.reduced; this.reset(0); };
  select = (screen: DemoScreen) => { this.userPaused = true; this.reset(DEMO_SCREEN_START[screen]); };
}
