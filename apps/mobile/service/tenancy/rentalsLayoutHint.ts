import AsyncStorage from "@react-native-async-storage/async-storage";

// Which Rentals page this account saw last time. Only picks the matching
// loading skeleton on the next launch — never shown as data, never used for
// access, and the screen always renders from the server's answer.
export type RentalsLayoutHint = "tenancy" | "applications";

const RENTALS_LAYOUT_KEY_PREFIX = "apt-rentals-layout:";

export function rentalsLayoutHintKey(authUserId: string): string {
  return `${RENTALS_LAYOUT_KEY_PREFIX}${authUserId}`;
}

export function isRentalsLayoutHint(value: unknown): value is RentalsLayoutHint {
  return value === "tenancy" || value === "applications";
}

/** The saved hint for this account, or null when nothing valid was stored. */
export async function loadRentalsLayoutHint(authUserId: string): Promise<RentalsLayoutHint | null> {
  try {
    const saved = await AsyncStorage.getItem(rentalsLayoutHintKey(authUserId));
    return isRentalsLayoutHint(saved) ? saved : null;
  } catch {
    // Best-effort: without a hint the screen falls back to the rental skeleton.
    return null;
  }
}

export async function saveRentalsLayoutHint(
  authUserId: string,
  hint: RentalsLayoutHint,
): Promise<void> {
  try {
    await AsyncStorage.setItem(rentalsLayoutHintKey(authUserId), hint);
  } catch {
    // Best-effort only; the next launch just uses the default skeleton.
  }
}
