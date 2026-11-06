// Wording and the on-device reminder for the "too many attempts" lock, shared by
// web and mobile. The database counters (authThrottle.ts) decide who is blocked,
// on the server, for both platforms; this file only turns a number of seconds into
// text and shapes the small reminder a phone keeps so a lock the server reported
// still shows after the app is closed.

export const AUTH_LOCKOUT_MAX_ATTEMPTS = 5;
export const AUTH_LOCKOUT_TITLE = "Too many attempts";

const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;

/** "about 1 minute" / "about 15 minutes": rounds up so the wait is never understated. */
export function formatLockoutWait(seconds: number): string {
  const minutes = Math.max(1, Math.ceil(seconds / SECONDS_PER_MINUTE));
  return minutes === 1 ? "1 minute" : `${minutes} minutes`;
}

/** Live countdown text, m:ss. */
export function formatLockoutClock(seconds: number): string {
  const safe = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(safe / SECONDS_PER_MINUTE);
  return `${minutes}:${String(safe % SECONDS_PER_MINUTE).padStart(2, "0")}`;
}

export function lockoutDescription(seconds: number): string {
  return `You've reached the limit of ${AUTH_LOCKOUT_MAX_ATTEMPTS} attempts. For your security, please try again in about ${formatLockoutWait(seconds)}.`;
}

/**
 * Short, non-cryptographic key so a device does not keep an email in plain text
 * next to its lock. It only separates one email's lock from another's.
 */
export function lockoutKeyHash(value: string): string {
  const normalized = value.trim().toLowerCase();
  let hash = 5381;
  for (let index = 0; index < normalized.length; index += 1) {
    hash = ((hash << 5) + hash + normalized.charCodeAt(index)) | 0;
  }
  return (hash >>> 0).toString(16);
}

// Reminder (mobile): a lock the server reported, kept on the device so the button
// stays disabled after the app closes. It never decides anything: the server counts
// and refuses an attempt that comes too soon, so clearing it only brings the dialog
// back on the next try. Epoch milliseconds.
export interface LockoutReminder {
  until: number;
}

export function lockoutReminderFor(seconds: number, now: number): LockoutReminder {
  return { until: now + seconds * MS_PER_SECOND };
}

/** Seconds left on a reminder, 0 when there is none or it has ended. */
export function lockoutReminderSecondsLeft(reminder: LockoutReminder | null, now: number): number {
  if (!reminder || reminder.until <= now) return 0;
  return Math.ceil((reminder.until - now) / MS_PER_SECOND);
}

export function parseLockoutReminder(raw: string | null | undefined): LockoutReminder | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<LockoutReminder>;
    if (typeof value.until === "number" && Number.isFinite(value.until)) return { until: value.until };
  } catch {
    // Unreadable: treat as no lock.
  }
  return null;
}
