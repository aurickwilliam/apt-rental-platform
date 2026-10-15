import AsyncStorage from "@react-native-async-storage/async-storage";

export const TENANT_QUICK_ACTION_IDS = [
  "receipts",
  "applications",
  "repairs",
  "repair-history",
  "my-rental",
  "message-landlord",
  "passport",
  "favorites",
  "settings",
  "faq",
] as const;

export type TenantQuickActionId = (typeof TENANT_QUICK_ACTION_IDS)[number];

export const DEFAULT_TENANT_QUICK_ACTION_IDS: TenantQuickActionId[] = [
  "receipts",
  "applications",
  "repairs",
  "settings",
  "faq",
];

export const MAX_TENANT_QUICK_ACTIONS = 5;

export type QuickActionSlot = TenantQuickActionId | null;

export function normalizeQuickActionSlots(value: unknown): QuickActionSlot[] {
  const source = Array.isArray(value) ? value : DEFAULT_TENANT_QUICK_ACTION_IDS;
  const seen = new Set<TenantQuickActionId>();
  return Array.from({ length: MAX_TENANT_QUICK_ACTIONS }, (_, index) => {
    const id = source[index];
    if (!isTenantQuickActionId(id) || seen.has(id)) return null;
    seen.add(id);
    return id;
  });
}

export function placeQuickAction(slots: readonly QuickActionSlot[], id: TenantQuickActionId, target: number): QuickActionSlot[] {
  const next = [...slots];
  if (target < 0 || target >= MAX_TENANT_QUICK_ACTIONS) return next;
  const source = next.indexOf(id);
  if (source === -1 && next[target] !== null) return next;
  if (source !== -1) next[source] = next[target];
  next[target] = id;
  return next;
}

export async function loadQuickActionSlots(authUserId: string): Promise<QuickActionSlot[]> {
  const saved = await AsyncStorage.getItem(tenantQuickActionsKey(authUserId));
  if (!saved) return normalizeQuickActionSlots(DEFAULT_TENANT_QUICK_ACTION_IDS);
  try {
    const value: unknown = JSON.parse(saved);
    return normalizeQuickActionSlots(
      value && typeof value === "object" && "slots" in value ? value.slots : value,
    );
  } catch {
    return normalizeQuickActionSlots(DEFAULT_TENANT_QUICK_ACTION_IDS);
  }
}

export async function saveQuickActionSlots(authUserId: string, slots: readonly QuickActionSlot[]): Promise<void> {
  await AsyncStorage.setItem(tenantQuickActionsKey(authUserId), JSON.stringify({ version: 1, slots: normalizeQuickActionSlots(slots) }));
}

const QUICK_ACTIONS_KEY_PREFIX = "apt-tenant-quick-actions:";

export function tenantQuickActionsKey(authUserId: string): string {
  return `${QUICK_ACTIONS_KEY_PREFIX}${authUserId}`;
}

export function isTenantQuickActionId(value: unknown): value is TenantQuickActionId {
  return typeof value === "string" && TENANT_QUICK_ACTION_IDS.includes(value as TenantQuickActionId);
}

export function normalizeTenantQuickActionIds(value: unknown): TenantQuickActionId[] {
  if (!Array.isArray(value)) return [...DEFAULT_TENANT_QUICK_ACTION_IDS];

  const ids = value.filter(isTenantQuickActionId);
  const uniqueIds = ids.filter((id, index) => ids.indexOf(id) === index);

  return uniqueIds.slice(0, MAX_TENANT_QUICK_ACTIONS);
}

export async function loadTenantQuickActionIds(
  authUserId: string,
): Promise<TenantQuickActionId[]> {
  const saved = await AsyncStorage.getItem(tenantQuickActionsKey(authUserId));
  if (!saved) return [...DEFAULT_TENANT_QUICK_ACTION_IDS];

  try {
    return normalizeTenantQuickActionIds(JSON.parse(saved));
  } catch {
    return [...DEFAULT_TENANT_QUICK_ACTION_IDS];
  }
}

export async function saveTenantQuickActionIds(
  authUserId: string,
  actionIds: readonly TenantQuickActionId[],
): Promise<void> {
  const normalized = normalizeTenantQuickActionIds(actionIds);
  await AsyncStorage.setItem(tenantQuickActionsKey(authUserId), JSON.stringify(normalized));
}
