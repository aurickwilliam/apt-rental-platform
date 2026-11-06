import { useCallback, useEffect, useState } from "react";

import {
  clearDeviceLockout,
  readDeviceLockoutSeconds,
  saveServerLockout,
  type AuthLockoutScope,
} from "@/service/auth/authLockoutStore";

// "Too many attempts" lock for one flow (`scope`) and one email. The server counts
// the attempts (shared with the website) and reports a lock with its seconds;
// `lockFor` shows it: a dialog, then a countdown that survives closing the app
// (a reminder in device storage, see authLockoutStore). Import by path, not
// through the hooks/auth barrel.

const TICK_MS = 1000;

interface Lock {
  /** Normalized email the lock belongs to, so changing the email drops the lock. */
  email: string;
  /** Epoch milliseconds when the lock ends. */
  until: number;
}

export function useAuthLockout(scope: AuthLockoutScope, email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const [lock, setLock] = useState<Lock | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [dialogOpen, setDialogOpen] = useState(false);

  const until = lock && lock.email === normalizedEmail ? lock.until : null;

  // Restores a lock left by an earlier session once the email is known. It only
  // ever sets a lock, so a slow read cannot undo one that just happened.
  useEffect(() => {
    if (!normalizedEmail) return;
    let cancelled = false;
    void readDeviceLockoutSeconds(scope, normalizedEmail).then((seconds) => {
      if (cancelled || seconds <= 0) return;
      const restoredUntil = Date.now() + seconds * 1000;
      setNow(Date.now());
      setLock((current) =>
        current && current.email === normalizedEmail && current.until >= restoredUntil
          ? current
          : { email: normalizedEmail, until: restoredUntil },
      );
    });
    return () => {
      cancelled = true;
    };
  }, [scope, normalizedEmail]);

  // The clock only runs while a lock is on screen.
  useEffect(() => {
    if (until === null) return;
    const timer = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(timer);
  }, [until]);

  const secondsLeft = until === null ? 0 : Math.max(0, Math.ceil((until - now) / 1000));

  /** A lock the server reported: opens the dialog, counts down, and is remembered. */
  const lockFor = useCallback(
    (seconds: number) => {
      if (!normalizedEmail || seconds <= 0) return;
      const current = Date.now();
      setNow(current);
      setLock({ email: normalizedEmail, until: current + seconds * 1000 });
      setDialogOpen(true);
      void saveServerLockout(scope, normalizedEmail, seconds);
    },
    [scope, normalizedEmail],
  );

  /** After a success: forgets the reminder. */
  const clear = useCallback(async () => {
    setLock(null);
    setDialogOpen(false);
    await clearDeviceLockout(scope, normalizedEmail);
  }, [scope, normalizedEmail]);

  return {
    secondsLeft,
    isLocked: secondsLeft > 0,
    lockFor,
    clear,
    /** The dialog closes by itself when the lock ends. */
    dialogOpen: dialogOpen && secondsLeft > 0,
    setDialogOpen,
  };
}
