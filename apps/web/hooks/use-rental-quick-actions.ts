"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

import {
  parseRentalQuickActions,
  rentalQuickActionsKey,
  serializeRentalQuickActions,
  type RentalQuickActionId,
} from "@/lib/rental-quick-actions";

const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function readStored(key: string | null): string | null {
  if (!key) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    // Private windows and blocked site data: fall back to the defaults.
    return null;
  }
}

/**
 * The account's chosen My Rental shortcuts in this browser. The server and
 * the first client render use the defaults, so hydration always matches.
 */
export function useRentalQuickActions(authUserId: string | null | undefined) {
  const key = authUserId ? rentalQuickActionsKey(authUserId) : null;
  const raw = useSyncExternalStore(subscribe, () => readStored(key), () => null);
  const ids = useMemo(() => parseRentalQuickActions(raw), [raw]);

  /** False when the choice could not be stored. */
  const save = useCallback(
    (next: readonly RentalQuickActionId[]): boolean => {
      if (!key) return false;
      try {
        window.localStorage.setItem(key, serializeRentalQuickActions(next));
      } catch {
        return false;
      }
      listeners.forEach((listener) => listener());
      return true;
    },
    [key],
  );

  return { ids, save };
}
