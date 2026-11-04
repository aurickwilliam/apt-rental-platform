/** Suspension lengths an admin can pick, in days; "permanent" has no end date. */
export const SUSPENSION_DAYS = [7, 30, 90] as const;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * End of a suspension from the form's `duration` ("permanent" or a number of
 * days): an ISO date, null for permanent, or undefined when the value is not
 * one of the offered lengths.
 */
export function suspensionEnd(duration: unknown, now: number = Date.now()): string | null | undefined {
  if (duration === undefined || duration === null || duration === "permanent") return null;
  if (typeof duration !== "string") return undefined;
  const days = Number(duration);
  if (!(SUSPENSION_DAYS as readonly number[]).includes(days)) return undefined;
  return new Date(now + days * DAY_MS).toISOString();
}
