"use client";

import { useSyncExternalStore } from "react";
import { useReducedMotion } from "motion/react";
import { getReducedMotion, subscribeReducedMotion } from "@/lib/reduced-motion";

const DESKTOP_DEPTH_QUERY = "(min-width: 1024px) and (hover: hover)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const serverFalse = () => false;

function subscribeSystemMotion(callback: () => void) {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function subscribeDesktopDepth(callback: () => void) {
  const query = window.matchMedia(DESKTOP_DEPTH_QUERY);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function getDesktopDepth() {
  return window.matchMedia(DESKTOP_DEPTH_QUERY).matches;
}

export function useLandingReducedMotion() {
  const motionReduced = useReducedMotion();
  // Motion initializes its preference globally; subscribe separately for live OS changes.
  const systemReduced = useSyncExternalStore(
    subscribeSystemMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches ?? Boolean(motionReduced),
    serverFalse,
  );
  const appReduced = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, serverFalse);
  return Boolean(systemReduced || appReduced);
}

export function useLandingDepth() {
  const reduced = useLandingReducedMotion();
  const desktop = useSyncExternalStore(subscribeDesktopDepth, getDesktopDepth, serverFalse);
  return desktop && !reduced;
}
