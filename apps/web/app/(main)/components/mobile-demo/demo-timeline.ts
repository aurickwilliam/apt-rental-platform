import type { DemoScreen } from "./demo-data";

export const DEMO_DURATION = 28.8;
export const DEMO_SCREEN_START: Record<DemoScreen, number> = {
  rentals: 0, payments: 3.8, messages: 12.03, conversation: 14.6,
};

type NavigationKind = "push" | "pop" | "tab";
interface Visit { id: string; screen: DemoScreen; start: number; duration: number; kind: NavigationKind }
const visits: readonly Visit[] = [
  { id: "rentals-start", screen: "rentals", start: 0, duration: 0, kind: "tab" },
  { id: "history", screen: "payments", start: 3.45, duration: .35, kind: "push" },
  { id: "rentals-return", screen: "rentals", start: 10.15, duration: .35, kind: "pop" },
  { id: "messages", screen: "messages", start: 11.85, duration: .18, kind: "tab" },
  { id: "conversation", screen: "conversation", start: 14.25, duration: .35, kind: "push" },
  { id: "messages-return", screen: "messages", start: 23.45, duration: .35, kind: "pop" },
  { id: "rentals-end", screen: "rentals", start: 25.05, duration: .18, kind: "tab" },
];

const taps = [
  { start: 3, target: "history" },
  { start: 9.7, target: "back" },
  { start: 11.4, target: "messages" },
  { start: 13.8, target: "landlord" },
  { start: 23, target: "back" },
  { start: 24.6, target: "rentals" },
] as const;
const TAP_DURATION = .45;
const clamp = (value: number) => Math.max(0, Math.min(1, value));
// Smooth starts/stops, without spring lag or independently running animations.
const smooth = (value: number) => { const p = clamp(value); return p * p * (3 - 2 * p); };

export interface DemoLayer {
  id: string;
  screen: DemoScreen;
  opacity: number;
  y: number;
  scroll: number;
}

function scrollFor(screen: DemoScreen, time: number): number {
  if (screen === "payments") return smooth((time - 5.2) / 3);
  // Native's inverted conversation container uses negative scrollTop for older messages.
  if (screen === "conversation") return -smooth((time - 16.1) / 2.5) * (1 - smooth((time - 20) / 2)) || 0;
  return 0;
}

/** A pure sample of the ENTIRE demo. All motion freezes when this time freezes. */
export function sampleDemo(time: number) {
  const t = Math.max(0, Math.min(DEMO_DURATION, Number.isFinite(time) ? time : 0));
  let index = 0;
  for (let i = 1; i < visits.length; i++) if (t >= visits[i].start) index = i;
  const visit = visits[index];
  const incoming: DemoLayer = { id: visit.id, screen: visit.screen, opacity: 1, y: 0, scroll: scrollFor(visit.screen, t) };
  const layers: DemoLayer[] = [incoming];
  const progress = visit.duration ? clamp((t - visit.start) / visit.duration) : 1;
  if (index > 0 && t < Number((visit.start + visit.duration).toFixed(3))) {
    const previous = visits[index - 1];
    const eased = smooth(progress);
    const outgoing: DemoLayer = { id: previous.id, screen: previous.screen, opacity: 1, y: 0, scroll: scrollFor(previous.screen, t) };
    if (visit.kind === "pop") {
      outgoing.opacity = 1 - eased;
      outgoing.y = 24 * eased;
      incoming.opacity = .92 + .08 * eased;
      // The popped screen is painted above the revealed screen.
      layers.splice(0, 1, incoming, outgoing);
    } else {
      incoming.opacity = eased;
      incoming.y = visit.kind === "push" ? 24 * (1 - eased) : 0;
      layers.unshift(outgoing);
    }
  }
  const tap = taps.find((tap) => t >= tap.start && t < tap.start + TAP_DURATION);
  const p = tap ? clamp((t - tap.start) / TAP_DURATION) : 0;
  return {
    screen: visit.screen,
    layers,
    layoutKey: layers.map((layer) => layer.id).join(":"),
    tap: tap ? {
      target: tap.target,
      opacity: Math.min(clamp(p / .18), clamp((1 - p) / .26)),
      scale: .7 + .45 * smooth(p),
      press: 1 - .015 * Math.sin(Math.PI * p),
    } : null,
  };
}
