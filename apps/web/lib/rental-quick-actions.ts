// Which shortcuts the tenant put on My Rental's Quick actions card. Kept in
// this browser per auth account, like mobile's per-device choice: a display
// preference only, never server data or an access rule.
export const RENTAL_QUICK_ACTION_IDS = [
  "receipts",
  "repairs",
  "message-landlord",
  "signed-lease",
  "my-rental",
  "favorites",
  "browse",
  "profile",
] as const;

export type RentalQuickActionId = (typeof RENTAL_QUICK_ACTION_IDS)[number];

export const MAX_RENTAL_QUICK_ACTIONS = 5;

export const DEFAULT_RENTAL_QUICK_ACTION_IDS: readonly RentalQuickActionId[] = [
  "receipts",
  "repairs",
  "message-landlord",
  "signed-lease",
  "my-rental",
];

const KEY_PREFIX = "apt-rental-quick-actions:v1:";

export function rentalQuickActionsKey(authUserId: string): string {
  return `${KEY_PREFIX}${authUserId}`;
}

export function isRentalQuickActionId(value: unknown): value is RentalQuickActionId {
  return typeof value === "string" && RENTAL_QUICK_ACTION_IDS.includes(value as RentalQuickActionId);
}

/** Known ids only, each once, in the saved order, capped at the card's five. */
export function normalizeRentalQuickActionIds(value: unknown): RentalQuickActionId[] {
  if (!Array.isArray(value)) return [...DEFAULT_RENTAL_QUICK_ACTION_IDS];
  const ids = value.filter(isRentalQuickActionId);
  return ids.filter((id, index) => ids.indexOf(id) === index).slice(0, MAX_RENTAL_QUICK_ACTIONS);
}

/** Reads a stored value; nothing saved or an unreadable value means the defaults. */
export function parseRentalQuickActions(raw: string | null | undefined): RentalQuickActionId[] {
  if (!raw) return [...DEFAULT_RENTAL_QUICK_ACTION_IDS];
  try {
    const value: unknown = JSON.parse(raw);
    return normalizeRentalQuickActionIds(
      value && typeof value === "object" && "ids" in value ? value.ids : null,
    );
  } catch {
    return [...DEFAULT_RENTAL_QUICK_ACTION_IDS];
  }
}

export function serializeRentalQuickActions(ids: readonly RentalQuickActionId[]): string {
  return JSON.stringify({ ids: normalizeRentalQuickActionIds([...ids]) });
}

/** Removes a chosen action, or adds one at the end while there is room. */
export function toggleRentalQuickAction(
  current: readonly RentalQuickActionId[],
  id: RentalQuickActionId,
): RentalQuickActionId[] {
  if (current.includes(id)) return current.filter((value) => value !== id);
  if (current.length >= MAX_RENTAL_QUICK_ACTIONS) return [...current];
  return [...current, id];
}
