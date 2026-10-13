"use client";

import { useCallback, useEffect, useState } from "react";

const TICK_MS = 1000;

// Seconds left on a restartable countdown (e.g. a resend cooldown). Counts
// from a deadline, so a throttled background tab still ends on time.
export function useCountdown(durationSeconds: number) {
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (endsAt === null) return;
    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= endsAt) clearInterval(timer);
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [endsAt]);

  const restart = useCallback(() => {
    const current = Date.now();
    setNow(current);
    setEndsAt(current + durationSeconds * 1000);
  }, [durationSeconds]);

  const secondsLeft = endsAt === null ? 0 : Math.max(0, Math.ceil((endsAt - now) / 1000));

  return { secondsLeft, restart };
}
