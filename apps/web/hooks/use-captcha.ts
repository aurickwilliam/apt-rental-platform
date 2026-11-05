"use client";

import { useCallback, useState } from "react";
import { TURNSTILE_ENABLED, type TurnstileHandle } from "@/app/components/inputs/TurnstileWidget";

export interface CaptchaAttempt {
  token?: string;
  /** The check is configured but not finished yet: do not send the request. */
  pending: boolean;
}

// Owner of one <TurnstileWidget ref={captcha.attach} />. `take()` hands out the
// single-use token and starts a new check, so call it once per attempt.
export function useCaptcha() {
  // A callback ref kept in state: the widget handle is only read in handlers.
  const [handle, setHandle] = useState<TurnstileHandle | null>(null);

  const take = useCallback((): CaptchaAttempt => {
    if (!TURNSTILE_ENABLED) return { pending: false };
    const token = handle?.getToken();
    if (!token) return { pending: true };
    handle?.reset();
    return { token, pending: false };
  }, [handle]);

  return { attach: setHandle, take };
}
