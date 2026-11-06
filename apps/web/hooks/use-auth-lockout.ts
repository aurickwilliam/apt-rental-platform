"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { lockoutKeyHash } from "@repo/utils";
import {
  laterLockout,
  lockoutSecondsLeft,
  lockoutStorageKey,
  parseStoredLockout,
  serializeLockout,
  type StoredLockout,
} from "@/lib/auth-lockout-store";

// A "too many attempts" lock for one flow (`scope`) and one email (`subject`).
// The server reports the seconds (sign-in and code actions); `lock()` remembers
// them in this browser, so a refresh or a closed tab keeps the button disabled
// until the lock ends, and counts down every second while it lasts. Storage is
// read through useSyncExternalStore (never an effect), and an in-memory copy keeps
// the lock working when storage is blocked. The database stays authoritative.
//
// `persist: false` keeps the lock in memory only, for flows that must never put
// the email (or anything derived from it) in storage: password recovery.

const CHANGE_EVENT = "apt-auth-lockout-change";
const TICK_MS = 1000;

function subscribeStorage(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function subscribeTick(onChange: () => void) {
  const timer = setInterval(onChange, TICK_MS);
  return () => clearInterval(timer);
}

const subscribeIdle = () => () => {};
const currentSecond = () => Math.floor(Date.now() / 1000);

export function useAuthLockout(
  scope: string,
  subject: string,
  { persist = true }: { persist?: boolean } = {},
) {
  const key = lockoutStorageKey(scope);
  const [memory, setMemory] = useState<StoredLockout | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const readRaw = useCallback(() => {
    if (!persist) return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }, [key, persist]);
  const raw = useSyncExternalStore(subscribeStorage, readRaw, () => null);
  const stored = useMemo(() => laterLockout(parseStoredLockout(raw), memory), [raw, memory]);

  const subjectHash = lockoutKeyHash(subject);
  // The clock only ticks while a lock for this email is on screen.
  const ticking = !!stored && stored.subject === subjectHash;
  const nowSeconds = useSyncExternalStore(ticking ? subscribeTick : subscribeIdle, currentSecond, () => 0);
  const secondsLeft = lockoutSecondsLeft(stored, subjectHash, nowSeconds);

  const lock = useCallback(
    (seconds: number, forSubject: string = subject) => {
      const lockout: StoredLockout = {
        until: Date.now() + seconds * 1000,
        subject: lockoutKeyHash(forSubject),
      };
      setMemory(lockout);
      if (persist) {
        try {
          window.localStorage.setItem(key, serializeLockout(lockout));
        } catch {
          // Storage blocked: the in-memory copy still holds the lock.
        }
        window.dispatchEvent(new Event(CHANGE_EVENT));
      }
      setModalOpen(true);
    },
    [key, subject, persist],
  );

  return {
    secondsLeft,
    isLocked: secondsLeft > 0,
    lock,
    /** The modal closes by itself when the lock ends. */
    modalOpen: modalOpen && secondsLeft > 0,
    setModalOpen,
  };
}
