"use client";

import { getVerificationPageState } from "../actions";

export interface VerificationPageSnapshot {
  signedIn: boolean;
  accountStatus: string | null;
  hasPending: boolean;
}

// Short-lived client cache for the modal's entry state. The profile card
// preloads it on mount/hover so opening the dialog rarely waits on a
// server roundtrip. Entries expire quickly; completion invalidates.
const CACHE_TTL_MS = 30_000;

let snapshot: VerificationPageSnapshot | null = null;
let snapshotAt = 0;
let inflight: Promise<VerificationPageSnapshot> | null = null;

function store(next: VerificationPageSnapshot): VerificationPageSnapshot {
  snapshot = next;
  snapshotAt = Date.now();
  return next;
}

function loadShared(): Promise<VerificationPageSnapshot> {
  const hit = readCachedVerificationPageState();
  if (hit) return Promise.resolve(hit);
  if (!inflight) {
    inflight = getVerificationPageState().then(
      (next) => {
        inflight = null;
        return store(next);
      },
      (error) => {
        inflight = null;
        throw error;
      },
    );
  }
  return inflight;
}

export function preloadVerificationPageState(): void {
  // Fire-and-forget: the dialog surfaces failures when it opens.
  loadShared().catch(() => {});
}

export function getVerificationPageStateShared(): Promise<VerificationPageSnapshot> {
  return loadShared();
}

export function readCachedVerificationPageState(): VerificationPageSnapshot | null {
  if (!snapshot || Date.now() - snapshotAt > CACHE_TTL_MS) return null;
  return snapshot;
}

export function invalidateVerificationPageState(): void {
  snapshot = null;
  snapshotAt = 0;
}
