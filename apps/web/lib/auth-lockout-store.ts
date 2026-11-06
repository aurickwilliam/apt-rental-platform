// Remembers a "too many attempts" lock in this browser so a refresh or a closed
// tab still shows Sign in / Verify disabled until it ends. Pure helpers (storage
// is injected by the hook) so they can be tested without a DOM. This is a
// reminder only: the database counters decide, so clearing the storage never
// gets anyone past a real lock (the server refuses the attempt and the lock
// comes back).
//
// Only a short hash of the email is stored (`lockoutKeyHash` in @repo/utils),
// never the email itself.

export const LOCKOUT_STORAGE_PREFIX = "apt-auth-lockout:v1:";

export interface StoredLockout {
  /** Epoch milliseconds when the lock ends. */
  until: number;
  /** `lockoutKeyHash(email)` the lock belongs to. */
  subject: string;
}

export function lockoutStorageKey(scope: string): string {
  return `${LOCKOUT_STORAGE_PREFIX}${scope}`;
}

export function serializeLockout(lockout: StoredLockout): string {
  return JSON.stringify(lockout);
}

export function parseStoredLockout(raw: string | null | undefined): StoredLockout | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<StoredLockout>;
    if (typeof value.until === "number" && Number.isFinite(value.until) && typeof value.subject === "string") {
      return { until: value.until, subject: value.subject };
    }
  } catch {
    // Unreadable: treat as no lock.
  }
  return null;
}

/** Whole seconds left for this subject at `nowSeconds` (epoch seconds), 0 when free. */
export function lockoutSecondsLeft(
  lockout: StoredLockout | null,
  subjectHash: string,
  nowSeconds: number,
): number {
  if (!lockout || lockout.subject !== subjectHash) return 0;
  return Math.max(0, Math.ceil(lockout.until / 1000 - nowSeconds));
}

/** Whichever lock lasts longer, so an in-memory lock still counts when storage fails. */
export function laterLockout(a: StoredLockout | null, b: StoredLockout | null): StoredLockout | null {
  if (!a) return b;
  if (!b) return a;
  return a.until >= b.until ? a : b;
}
