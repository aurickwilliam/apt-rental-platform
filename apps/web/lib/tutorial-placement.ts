// Where the tutorial card sits relative to the highlighted element. Pure so
// it can be tested without a browser: the card goes beside the target when it
// fits (sidebar targets, so usually to the right), then below, then above;
// narrow screens dock it at the bottom, and a missing target centers it.

export interface TutorialBox {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface TutorialPlacementInput {
  target: TutorialBox | null;
  viewport: { width: number; height: number };
  card: { width: number; height: number };
  gap?: number;
  margin?: number;
}

export type TutorialPlacementMode = "beside" | "below" | "above" | "docked" | "centered";

export interface TutorialPlacement {
  mode: TutorialPlacementMode;
  top: number;
  left: number;
  width: number;
}

/** Below this viewport width the card docks to the bottom of the screen. */
export const TUTORIAL_NARROW_VIEWPORT = 640;

const DEFAULT_GAP = 12;
const DEFAULT_MARGIN = 16;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

export function computeTutorialPlacement({
  target,
  viewport,
  card,
  gap = DEFAULT_GAP,
  margin = DEFAULT_MARGIN,
}: TutorialPlacementInput): TutorialPlacement {
  const maxWidth = Math.max(0, viewport.width - margin * 2);
  const width = Math.min(card.width, maxWidth);
  const maxLeft = viewport.width - width - margin;
  const maxTop = viewport.height - card.height - margin;

  if (viewport.width < TUTORIAL_NARROW_VIEWPORT) {
    return { mode: "docked", top: Math.max(margin, maxTop), left: margin, width: maxWidth };
  }

  if (!target) {
    return {
      mode: "centered",
      top: clamp((viewport.height - card.height) / 2, margin, maxTop),
      left: clamp((viewport.width - width) / 2, margin, maxLeft),
      width,
    };
  }

  const beside = target.left + target.width + gap;
  if (beside + width + margin <= viewport.width) {
    return {
      mode: "beside",
      top: clamp(target.top + target.height / 2 - card.height / 2, margin, maxTop),
      left: beside,
      width,
    };
  }

  const below = target.top + target.height + gap;
  if (below + card.height + margin <= viewport.height) {
    return { mode: "below", top: below, left: clamp(target.left, margin, maxLeft), width };
  }

  const above = target.top - gap - card.height;
  if (above >= margin) {
    return { mode: "above", top: above, left: clamp(target.left, margin, maxLeft), width };
  }

  return {
    mode: "centered",
    top: clamp((viewport.height - card.height) / 2, margin, maxTop),
    left: clamp((viewport.width - width) / 2, margin, maxLeft),
    width,
  };
}
