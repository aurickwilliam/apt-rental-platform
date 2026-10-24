"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Countdown for "Resend code" links: start() after a send, stop() to clear it.
export function useResendCooldown(defaultSeconds: number) {
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => clear, [clear]);

  const start = useCallback(
    (seconds: number = defaultSeconds) => {
      clear();
      setCooldown(seconds);
      timerRef.current = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clear();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [clear, defaultSeconds],
  );

  const stop = useCallback(() => {
    clear();
    setCooldown(0);
  }, [clear]);

  const format = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }, []);

  return { cooldown, start, stop, format };
}
