"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import { animate, useInView, useMotionValue, useMotionValueEvent } from "motion/react";
import { useLandingReducedMotion } from "@/hooks/use-landing-motion";
import { DemoPlaybackController } from "./demo-playback-controller";
import { DEMO_DURATION, sampleDemo } from "./demo-timeline";
import { DEMO_VIEWPORT } from "./demo-data";

export function useDemoPlayback(stage: RefObject<HTMLDivElement | null>) {
  const [controller] = useState(() => new DemoPlaybackController());
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const reduced = useLandingReducedMotion();
  const visible = useInView(stage, { amount: .35 });
  const clock = useMotionValue(0);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const opacity = useMotionValue(0);
  const scale = useMotionValue(1);
  const touch = useMemo(() => ({ x, y, opacity, scale }), [x, y, opacity, scale]);
  const pressed = useRef<HTMLElement | null>(null);

  // One linear, pausable Motion clock. Nothing else has its own timer/tween.
  useEffect(() => {
    const controls = animate(clock, [0, DEMO_DURATION], { duration: DEMO_DURATION, ease: "linear", repeat: Infinity, autoplay: false });
    return controller.attach({
      play: () => controls.play(), pause: () => controls.pause(), stop: () => controls.stop(),
      seek: (time) => { controls.time = time; clock.set(time); },
    });
  }, [clock, controller]);

  useEffect(() => { controller.setEnvironment({ visible, reduced }); }, [controller, visible, reduced]);
  useEffect(() => {
    const update = () => controller.setEnvironment({ documentVisible: document.visibilityState === "visible" });
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, [controller]);
  useEffect(() => {
    let retired = false;
    const images = Array.from(stage.current?.querySelectorAll("img") ?? []);
    // Fail open to the already visible static image fallback, never a skeleton.
    void Promise.all([document.fonts.ready, ...images.map((image) => image.decode().catch(() => undefined))]).then(() => {
      if (!retired) controller.setEnvironment({ ready: true });
    });
    return () => { retired = true; };
  }, [controller, stage]);

  const paint = useCallback((time: number) => {
    const root = stage.current;
    if (!root) return;
    const frame = sampleDemo(time);
    root.setAttribute("data-demo-time", time.toFixed(3));
    const elements = root.querySelectorAll<HTMLElement>("[data-demo-layer]");
    let active: HTMLElement | undefined;
    elements.forEach((element) => {
      const layer = frame.layers.find((layer) => layer.id === element.dataset.demoLayer);
      if (!layer) return;
      element.style.opacity = String(layer.opacity);
      element.style.transform = layer.y ? `translateY(${layer.y}px)` : "none";
      // Android's status/gesture areas don't travel with a pushed page. Counter
      // the content's 24px entrance while retaining the approved chrome pixels.
      element.querySelectorAll<HTMLElement>("[data-demo-os-chrome]").forEach((chrome) => {
        chrome.style.transform = layer.y ? `translateY(${-layer.y}px)` : "none";
      });
      const scroll = element.querySelector<HTMLElement>("[tabindex='0']");
      if (scroll) {
        const target = layer.scroll * Math.max(0, scroll.scrollHeight - scroll.clientHeight);
        if (Math.abs(scroll.scrollTop - target) > .1) scroll.scrollTop = target;
      }
      if (layer.screen === frame.screen) active = element;
    });
    const target = frame.tap && !controller.getSnapshot().reduced
      ? active?.querySelector<HTMLElement>(`[data-demo-tap="${frame.tap.target}"]`) : null;
    if (pressed.current && pressed.current !== target) pressed.current.style.removeProperty("transform");
    pressed.current = target ?? null;
    const viewport = root.querySelector<HTMLElement>("[data-demo-viewport]");
    if (!target || !viewport || !frame.tap) { touch.opacity.set(0); return; }
    const screenBounds = viewport.getBoundingClientRect();
    const bounds = target.getBoundingClientRect();
    const scale = screenBounds.width / DEMO_VIEWPORT.width;
    touch.x.set((bounds.left + bounds.width / 2 - screenBounds.left) / scale);
    touch.y.set((bounds.top + bounds.height / 2 - screenBounds.top) / scale);
    touch.opacity.set(frame.tap.opacity);
    touch.scale.set(frame.tap.scale);
    target.style.transform = `scale(${frame.tap.press})`;
  }, [controller, stage, touch]);

  useMotionValueEvent(clock, "change", (time) => { controller.tick(time); paint(time); });
  // Seed newly mounted transition layers before paint; no incoming-frame flash.
  useLayoutEffect(() => { paint(clock.get()); }, [clock, paint, state.layoutKey, state.revision]);
  useEffect(() => () => { pressed.current?.style.removeProperty("transform"); }, []);

  return { state, controller, touch, reduced };
}
