import AsyncStorage from "@react-native-async-storage/async-storage";
import { reviewUnlockDismissalKey } from "./reviewUnlockStorage";

/** DevTools console only. Reload after resetting so the session latch is fresh. */
async function resetReviewUnlock(authUserId: string, tenancyId: string): Promise<void> {
  if (!__DEV__) throw new Error("Review prompt reset is development-only.");
  if (!authUserId || !tenancyId) throw new Error("Supply the Auth user ID and tenancy ID.");
  await AsyncStorage.removeItem(reviewUnlockDismissalKey(authUserId, tenancyId));
}

export function installReviewUnlockTesting(): void {
  if (__DEV__) {
    Object.assign(globalThis, { aptResetReviewUnlock: resetReviewUnlock });
  }
}
