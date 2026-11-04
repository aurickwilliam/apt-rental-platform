import { supabase, type Database } from '@repo/supabase';
import {
  isNotificationVisibleInPortal,
  resolveChatAudiencesWith,
  type ChatRecipientAudience,
} from '@repo/utils';

export type NotificationRow = Database['public']['Tables']['notifications']['Row'];

export type NotificationItem = Pick<
  NotificationRow,
  'id' | 'user_id' | 'type' | 'title' | 'message' | 'data' | 'is_read' | 'created_at'
> & {
  /** Read-time chat audience (tenant or landlord portal); never persisted. */
  resolvedChatAudience?: ChatRecipientAudience;
};

export type NotificationType = NotificationItem['type'];

export interface NotificationPreferences {
  notifications_enabled: boolean;
  push_enabled: boolean;
  show_chat_toasts: boolean;
  payment: boolean;
  message: boolean;
  maintenance: boolean;
  apartment: boolean;
  system: boolean;
}

export type NotificationPreferenceType = 'payment' | 'message' | 'maintenance' | 'apartment' | 'system';

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  notifications_enabled: true,
  push_enabled: true,
  show_chat_toasts: false,
  payment: true,
  message: true,
  maintenance: true,
  apartment: true,
  system: true,
};

const NOTIFICATION_PREFERENCE_FIELDS =
  'notifications_enabled, push_enabled, show_chat_toasts, payment, message, maintenance, apartment, system';

export async function fetchNotificationPreferences(userId: string): Promise<NotificationPreferences> {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select(NOTIFICATION_PREFERENCE_FIELDS)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;

  return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...(data ?? {}) };
}

export async function updateNotificationPreferences(
  userId: string,
  preferences: NotificationPreferences,
): Promise<void> {
  const { error } = await supabase
    .from('notification_preferences')
    .upsert(
      {
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );

  if (error) throw error;
}

/** Rows requested per round trip, and how many a portal feed shows. */
export const NOTIFICATION_PAGE_SIZE = 50;
/** Hard bound on rows scanned to fill one portal's feed (five pages). */
export const NOTIFICATION_MAX_SCANNED_ROWS = 250;

// An apartment's landlord never changes, so ownership is looked up once per
// apartment per app session instead of on every feed refresh.
const APARTMENT_OWNER_CACHE_LIMIT = 500;
const apartmentOwners = new Map<string, string | null>();

async function fetchApartmentOwners(apartmentIds: string[]) {
  const missing = apartmentIds.filter((id) => !apartmentOwners.has(id));

  if (missing.length > 0) {
    const { data, error } = await supabase
      .from('apartments')
      .select('id, landlord_id')
      .in('id', missing);
    if (error) throw error;

    if (apartmentOwners.size + missing.length > APARTMENT_OWNER_CACHE_LIMIT) apartmentOwners.clear();
    for (const apartment of data ?? []) apartmentOwners.set(apartment.id, apartment.landlord_id);
  }

  return apartmentIds
    .filter((id) => apartmentOwners.has(id))
    .map((id) => ({ id, landlord_id: apartmentOwners.get(id) ?? null }));
}

/** Test seam: forget remembered apartment owners. */
export function clearApartmentOwnerCache(): void {
  apartmentOwners.clear();
}

/**
 * Adds the read-time chat audience to rows. Chat about an apartment has no
 * recipient portal in its payload, so the apartment's owner decides it; any
 * failure leaves such chat unresolved (hidden from every portal) rather than
 * guessing. Other rows pass through unchanged.
 */
export function resolveNotificationAudiences(
  notifications: NotificationItem[],
  userId: string,
): Promise<NotificationItem[]> {
  return resolveChatAudiencesWith(
    notifications,
    userId,
    fetchApartmentOwners,
    // No PII or message text in logs; chat stays unresolved without writes.
    () => console.error("[notifications] Couldn't resolve chat notification ownership."),
  );
}

interface NotificationCursor {
  createdAt: string;
  id: string;
}

async function fetchNotificationRows(
  userId: string,
  cursor: NotificationCursor | null,
): Promise<NotificationItem[]> {
  let query = supabase
    .from('notifications')
    .select('id, user_id, type, title, message, data, is_read, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: true })
    .limit(NOTIFICATION_PAGE_SIZE);

  // Strictly after the cursor in (created_at desc, id asc) order.
  if (cursor) {
    query = query.or(
      `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.gt.${cursor.id})`,
    );
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []) as NotificationItem[];
}

/**
 * The latest notifications the given portal shows, newest first. The account
 * feed spans both portals, so heavy activity in one cannot push the other's
 * rows out of view: pages are read (keyset, bounded) until the portal has a
 * full page of its own rows, the account runs out, or the scan limit is hit.
 */
export async function fetchPortalNotifications(
  userId: string,
  portal: 'tenant' | 'landlord',
  limit = NOTIFICATION_PAGE_SIZE,
): Promise<NotificationItem[]> {
  const visible: NotificationItem[] = [];
  let cursor: NotificationCursor | null = null;
  let scanned = 0;

  while (visible.length < limit && scanned < NOTIFICATION_MAX_SCANNED_ROWS) {
    const rows = await fetchNotificationRows(userId, cursor);
    scanned += rows.length;

    const resolved = await resolveNotificationAudiences(rows, userId);
    for (const notification of resolved) {
      if (isNotificationVisibleInPortal(notification, portal)) visible.push(notification);
    }

    if (rows.length < NOTIFICATION_PAGE_SIZE) break;
    const last = rows[rows.length - 1];
    cursor = { createdAt: last.created_at, id: last.id };
  }

  return visible.slice(0, limit);
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

/** Marks exactly these rows read (a portal's visible unread rows, never the whole account). */
export async function markNotificationsRead(ids: string[]): Promise<void> {
  if (ids.length === 0) return;

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .in('id', ids);

  if (error) throw error;
}

export async function registerPushToken(token: string, platform: 'ios' | 'android'): Promise<void> {
  const { error } = await supabase.rpc('register_push_token', {
    p_token: token,
    p_platform: platform,
  });

  if (error) throw error;
}

export async function deletePushToken(token: string): Promise<void> {
  const { error } = await supabase.from('push_tokens').delete().eq('token', token);

  if (error) throw error;
}
