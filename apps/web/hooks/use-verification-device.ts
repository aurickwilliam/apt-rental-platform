"use client";

import { useSyncExternalStore } from "react";
import { classifyVerificationDevice } from "@/lib/verification-device";

const COARSE_POINTER_QUERY = "(pointer: coarse)";
function subscribe(onChange: () => void) {
  const pointer = window.matchMedia(COARSE_POINTER_QUERY);
  pointer.addEventListener("change", onChange);
  window.addEventListener("resize", onChange, { passive: true });
  return () => {
    pointer.removeEventListener("change", onChange);
    window.removeEventListener("resize", onChange);
  };
}

function getDevice() {
  const browser = navigator as Navigator & { userAgentData?: { mobile?: boolean; platform?: string } };
  return classifyVerificationDevice({
    userAgent: browser.userAgent,
    platform: browser.platform,
    maxTouchPoints: browser.maxTouchPoints,
    clientHints: browser.userAgentData,
    coarsePointer: window.matchMedia(COARSE_POINTER_QUERY).matches,
    screenShortEdge: Math.min(window.screen.width, window.screen.height),
  });
}

// The same neutral loading state renders on the server and during hydration;
// device-specific methods appear only once browser signals are available.
export function useVerificationDevice() {
  return useSyncExternalStore(subscribe, getDevice, () => null);
}
