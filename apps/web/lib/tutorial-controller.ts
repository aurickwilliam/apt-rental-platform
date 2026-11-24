// Settings → Tutorial asks the mounted tour to replay. A tiny external store
// (not a context, see AGENTS.md) carries the request across the Settings
// modal and the portal layout without a route or query param.
import { useSyncExternalStore } from "react";
import type { TutorialPortal } from "@repo/utils";

export interface TutorialReplayRequest {
  id: number;
  portal: TutorialPortal;
}

let request: TutorialReplayRequest | null = null;
const listeners = new Set<() => void>();

export function requestTutorialReplay(portal: TutorialPortal): void {
  request = { id: (request?.id ?? 0) + 1, portal };
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useTutorialReplayRequest(): TutorialReplayRequest | null {
  return useSyncExternalStore(subscribe, () => request, () => null);
}

// On phone widths the nav links live in a drawer. While the tour runs, it asks
// the portal's top bar to keep that drawer open, and draws its layer inside the
// drawer's own overlay (a node outside a modal overlay is made inert).
let navMenuOpen = false;
let layerHost: HTMLElement | null = null;
const navListeners = new Set<() => void>();

function emitNav() {
  for (const listener of navListeners) listener();
}

function subscribeNav(listener: () => void) {
  navListeners.add(listener);
  return () => {
    navListeners.delete(listener);
  };
}

export function setTutorialNavMenuOpen(open: boolean): void {
  if (navMenuOpen === open) return;
  navMenuOpen = open;
  emitNav();
}

export function useTutorialNavMenuOpen(): boolean {
  return useSyncExternalStore(subscribeNav, () => navMenuOpen, () => false);
}

/** Ref callback for the node inside the drawer overlay that hosts the tour layer. */
export function setTutorialLayerHost(element: HTMLElement | null): void {
  if (layerHost === element) return;
  layerHost = element;
  emitNav();
}

export function useTutorialLayerHost(): HTMLElement | null {
  return useSyncExternalStore(subscribeNav, () => layerHost, () => null);
}
