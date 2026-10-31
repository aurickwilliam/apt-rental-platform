import type { JourneyCompletion } from "./journey-geometry";

export const CTA_HIGHLIGHT_DURATION = 800;
export const CTA_HIGHLIGHT_RESET_DISTANCE = 24;
export type CtaHighlightState = "armed" | "played";

export function ctaHighlightTransition(state: CtaHighlightState, progress: number, completion: JourneyCompletion, height: number) {
  const { arrivalProgress, fadeEndProgress } = completion;
  if (![progress, arrivalProgress, fadeEndProgress, height].every(Number.isFinite) || height <= 0 || fadeEndProgress <= arrivalProgress) {
    return { state, play: false, cancel: true };
  }
  if (progress >= fadeEndProgress) {
    return { state: "played" as const, play: state === "armed", cancel: false };
  }
  const reset = Math.max(arrivalProgress, fadeEndProgress - CTA_HIGHLIGHT_RESET_DISTANCE / height);
  return { state: progress <= reset ? "armed" as const : state, play: false, cancel: true };
}

export const CTA_ACCENT_KEYFRAMES = [
  { opacity: 0, transform: "scaleY(0.94)", offset: 0 },
  { opacity: 0.58, transform: "scaleY(1)", offset: 0.22 },
  { opacity: 0.58, transform: "scaleY(1)", offset: 0.55 },
  { opacity: 0, transform: "scaleY(1)", offset: 1 },
];
export const CTA_BUTTON_KEYFRAMES = [
  { filter: "brightness(1)", offset: 0 },
  { filter: "brightness(1.045)", offset: 0.3 },
  { filter: "brightness(1)", offset: 1 },
];
