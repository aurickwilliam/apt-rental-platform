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
