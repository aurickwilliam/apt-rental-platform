import { useCallback, useState } from "react";

import CaptchaWidget, { type CaptchaHandle } from "@/components/auth/CaptchaWidget";
import { CAPTCHA_ENABLED } from "@/constants/captcha";

export interface CaptchaAttempt {
  token?: string;
  /** The check is configured but not finished yet: do not send the request. */
  pending: boolean;
}

// Owns one captcha widget. Render `widget` on the screen and call `take()` once
// per attempt: it hands out the single-use token and starts a new check. Import
// by path, not through the hooks/auth barrel.
export function useCaptcha() {
  const [handle, setHandle] = useState<CaptchaHandle | null>(null);

  const take = useCallback((): CaptchaAttempt => {
    if (!CAPTCHA_ENABLED) return { pending: false };
    const token = handle?.getToken();
    if (!token) return { pending: true };
    handle?.reset();
    return { token, pending: false };
  }, [handle]);

  // For a second request right after one used the token: waits briefly for the
  // fresh check instead of failing on the gap.
  const takeWhenReady = useCallback(async (timeoutMs = 4000): Promise<CaptchaAttempt> => {
    if (!CAPTCHA_ENABLED) return { pending: false };
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const token = handle?.getToken();
      if (token) {
        handle?.reset();
        return { token, pending: false };
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    return { pending: true };
  }, [handle]);

  return { widget: <CaptchaWidget ref={setHandle} />, take, takeWhenReady };
}
