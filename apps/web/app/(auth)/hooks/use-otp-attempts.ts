"use client";

import { useCallback, useRef, useState } from "react";
import { MAX_OTP_ATTEMPTS } from "@repo/utils";

// Wrong-code attempts for the code currently sent (same limit as mobile).
// recordWrongCode() returns the attempts left (0 = locked); reset() after a new code.
export function useOtpAttempts() {
  const remainingRef = useRef(MAX_OTP_ATTEMPTS);
  const [locked, setLocked] = useState(false);

  const recordWrongCode = useCallback((): number => {
    remainingRef.current -= 1;
    if (remainingRef.current <= 0) setLocked(true);
    return remainingRef.current;
  }, []);

  const reset = useCallback(() => {
    remainingRef.current = MAX_OTP_ATTEMPTS;
    setLocked(false);
  }, []);

  return { locked, recordWrongCode, reset };
}
