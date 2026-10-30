
import type { DemoScreen } from "./demo-data";

// Complete walkthrough: 14 seconds.
export const DEMO_DURATION = 14;

export const DEMO_SCREEN_START: Record<DemoScreen, number> = {
  rentals: 0,
  payments: 1.05,
  messages: 4.4,
  conversation: 5.75,
};

type NavigationKind = "push" | "pop" | "tab";

interface Visit {
  id: string;
  screen: DemoScreen;
  start: number;
  duration: number;
  kind: NavigationKind;
}

const visits: readonly Visit[] = [
  {
    id: "rentals-start",
    screen: "rentals",
    start: 0,
    duration: 0,
    kind: "tab",
  },
  {
    id: "history",
    screen: "payments",
    start: 0.8,
    duration: 0.25,
    kind: "push",
  },
  {
    id: "rentals-return",
    screen: "rentals",
    start: 3.4,
    duration: 0.25,
    kind: "pop",
  },
  {
    id: "messages",
    screen: "messages",
    start: 4.2,
    duration: 0.2,
    kind: "tab",
  },
  {
    id: "conversation",
    screen: "conversation",
    start: 5.5,
    duration: 0.25,
    kind: "push",
  },
  {
    id: "messages-return",
    screen: "messages",
    start: 10.2,
    duration: 0.25,
    kind: "pop",
  },
  {
    id: "rentals-end",
    screen: "rentals",
    start: 11.3,
    duration: 0.2,
    kind: "tab",
  },
];

const taps = [
  { start: 0.46, target: "history" },
  { start: 3.06, target: "back" },
  { start: 3.85, target: "messages" },
  { start: 5.15, target: "landlord" },
  { start: 9.85, target: "back" },
  { start: 10.95, target: "rentals" },
] as const;

const TAP_DURATION = 0.3;

const clamp = (value: number) =>
  Math.max(0, Math.min(1, value));

// Smooth starts and stops without spring lag.
const smooth = (value: number) => {
  const p = clamp(value);
  return p * p * (3 - 2 * p);
};

export interface DemoLayer {
  id: string;
  screen: DemoScreen;
  opacity: number;
  y: number;
  scroll: number;
}

function scrollFor(screen: DemoScreen, time: number): number {
  // Payment History: fast, controlled scroll.
  if (screen === "payments") {
    return smooth((time - 1.5) / 1.1);
  }

  // Conversation: scroll to older messages, then return.
  // Native inverted container uses negative scrollTop.
  if (screen === "conversation") {
    return (
      -smooth((time - 6.3) / 1.8) *
        (1 - smooth((time - 8.5) / 1.0)) || 0
    );
  }

  return 0;
}

/**
 * A pure sample of the entire demo.
 * Every animation freezes when playback time freezes.
 */
export function sampleDemo(time: number) {
  const t = Math.max(
    0,
    Math.min(
      DEMO_DURATION,
      Number.isFinite(time) ? time : 0
    )
  );

  let index = 0;

  for (let i = 1; i < visits.length; i++) {
    if (t >= visits[i].start) index = i;
  }

  const visit = visits[index];

  const incoming: DemoLayer = {
    id: visit.id,
    screen: visit.screen,
    opacity: 1,
    y: 0,
    scroll: scrollFor(visit.screen, t),
  };

  const layers: DemoLayer[] = [incoming];

  const progress = visit.duration
    ? clamp((t - visit.start) / visit.duration)
    : 1;

  if (
    index > 0 &&
    t < Number((visit.start + visit.duration).toFixed(3))
  ) {
    const previous = visits[index - 1];
    const eased = smooth(progress);

    const outgoing: DemoLayer = {
      id: previous.id,
      screen: previous.screen,
      opacity: 1,
      y: 0,
      scroll: scrollFor(previous.screen, t),
    };

    if (visit.kind === "pop") {
      outgoing.opacity = 1 - eased;
      outgoing.y = 24 * eased;
      incoming.opacity = 0.92 + 0.08 * eased;

      layers.splice(0, 1, incoming, outgoing);
    } else {
      incoming.opacity = eased;
      incoming.y =
        visit.kind === "push"
          ? 24 * (1 - eased)
          : 0;

      layers.unshift(outgoing);
    }
  }

  const tap = taps.find(
    (tap) =>
      t >= tap.start &&
      t < tap.start + TAP_DURATION
  );

  const p = tap
    ? clamp((t - tap.start) / TAP_DURATION)
    : 0;

  return {
    screen: visit.screen,
    layers,
    layoutKey: layers
      .map((layer) => layer.id)
      .join(":"),
    tap: tap
      ? {
          target: tap.target,
          opacity: Math.min(
            clamp(p / 0.18),
            clamp((1 - p) / 0.26)
          ),
          scale: 0.7 + 0.45 * smooth(p),
          press:
            1 - 0.015 * Math.sin(Math.PI * p),
        }
      : null,
  };
}
