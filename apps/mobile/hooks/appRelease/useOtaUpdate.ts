import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import * as Updates from "expo-updates";

const FOREGROUND_CHECK_INTERVAL_MS = 15 * 60 * 1000;

/**
 * Over-the-air updates (EAS Update). expo-updates already checks at launch and
 * applies the download on the next launch; this also checks when the app comes
 * back to the foreground (at most every 15 minutes) and offers a restart once an
 * update has been downloaded, so a fix does not wait for a second launch.
 * Disabled in development builds, where Updates.isEnabled is false.
 */
export function useOtaUpdate() {
  const { isUpdatePending } = Updates.useUpdates();
  const [deferred, setDeferred] = useState(false);
  const lastCheckAt = useRef(0);

  useEffect(() => {
    if (!Updates.isEnabled) return undefined;
    const checkForUpdate = async () => {
      const now = Date.now();
      if (now - lastCheckAt.current < FOREGROUND_CHECK_INTERVAL_MS) return;
      lastCheckAt.current = now;
      try {
        const { isAvailable } = await Updates.checkForUpdateAsync();
        if (isAvailable) await Updates.fetchUpdateAsync();
      } catch (error) {
        console.warn("Could not check for an over-the-air update", error);
      }
    };
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void checkForUpdate();
    });
    return () => subscription.remove();
  }, []);

  const restart = useCallback(() => {
    Updates.reloadAsync().catch((error: unknown) => {
      console.error("Could not restart to apply the update", error);
    });
  }, []);

  const defer = useCallback(() => setDeferred(true), []);

  return { isReady: Updates.isEnabled && isUpdatePending && !deferred, restart, defer };
}
