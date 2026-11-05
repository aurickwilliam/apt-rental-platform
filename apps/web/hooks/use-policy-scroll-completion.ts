"use client";

import { useEffect, useRef } from "react";
import type { RegistrationPolicy } from "@/lib/registration-policies";

// Mounted with the loaded document, never its Suspense/error fallback. Observe
// only the active scroll panel, not the window or retained hidden policy tab.
export function usePolicyScrollCompletion(policy: RegistrationPolicy, active: boolean, onRead: (policy: RegistrationPolicy) => void) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const end = endRef.current;
    const panel = end?.closest<HTMLElement>('[role="tabpanel"]');
    if (!active || !end || !panel) return;

    let retired = false;
    const observer = new IntersectionObserver(entries => {
      if (retired || panel.hidden || panel.inert || panel.clientHeight <= 0) return;
      if (entries.some(entry => entry.target === end && entry.isIntersecting && entry.intersectionRatio >= 1)) {
        retired = true;
        observer.disconnect();
        onRead(policy);
      }
    }, { root: panel, threshold: 1 });
    observer.observe(end);
    return () => { retired = true; observer.disconnect(); };
  }, [policy, active, onRead]);
  return endRef;
}
