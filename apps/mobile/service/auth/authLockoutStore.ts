import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  lockoutKeyHash,
  lockoutReminderFor,
  lockoutReminderSecondsLeft,
  parseLockoutReminder,
} from "@repo/utils";

// A reminder of a "too many attempts" lock the server reported, so the button
// stays disabled and counts down after the app is closed and reopened. It never
// counts anything and never decides: the web server counts every attempt in the
// database (shared with the website) and refuses one that comes too soon, so
// reinstalling the app or clearing its data only brings the dialog back on the
// next try. Only a short hash of the email is stored, never the email.

export type AuthLockoutScope = "signin" | "signup_otp" | "recovery_otp";

const STORAGE_PREFIX = "apt:auth-lockout:v2:";

function storageKey(scope: AuthLockoutScope, email: string): string | null {
  const normalized = email.trim().toLowerCase();
  return normalized ? `${STORAGE_PREFIX}${scope}:${lockoutKeyHash(normalized)}` : null;
}

/** Seconds left on this email's reminder, 0 when there is none. */
export async function readDeviceLockoutSeconds(
  scope: AuthLockoutScope,
  email: string,
  now: number = Date.now(),
): Promise<number> {
  const key = storageKey(scope, email);
  if (!key) return 0;
  try {
    return lockoutReminderSecondsLeft(parseLockoutReminder(await AsyncStorage.getItem(key)), now);
  } catch {
    // Never log the key or the email.
    console.error("Auth lockout storage unavailable.");
    return 0;
  }
}

/** Remembers a lock the server reported, for the same number of seconds. */
export async function saveServerLockout(
  scope: AuthLockoutScope,
  email: string,
  seconds: number,
  now: number = Date.now(),
): Promise<void> {
  const key = storageKey(scope, email);
  if (!key) return;
  try {
    await AsyncStorage.setItem(key, JSON.stringify(lockoutReminderFor(seconds, now)));
  } catch {
    console.error("Auth lockout storage unavailable.");
  }
}

/** Forgets this email's reminder after a success. */
export async function clearDeviceLockout(scope: AuthLockoutScope, email: string): Promise<void> {
  const key = storageKey(scope, email);
  if (!key) return;
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    console.error("Auth lockout storage unavailable.");
  }
}
