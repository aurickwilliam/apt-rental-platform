import { supabase, type Database } from '@repo/supabase';

export type NotificationRow = Database['public']['Tables']['notifications']['Row'];
type PushTokenRow = Database['public']['Tables']['push_tokens']['Row'];

export type NotificationItem = Pick<
  NotificationRow,
  'id' | 'user_id' | 'type' | 'title' | 'message' | 'data' | 'is_read' | 'created_at'
>;

export type NotificationType = NotificationItem['type'];

export interface NotificationPreferences {
  notifications_enabled: boolean;
  payment: boolean;
  message: boolean;
  maintenance: boolean;
  apartment: boolean;
  system: boolean;
}

export type NotificationPreferenceType = Exclude<keyof NotificationPreferences, 'notifications_enabled'>;

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  notifications_enabled: true,
  payment: true,
  message: true,
  maintenance: true,
  apartment: true,
  system: true,
};

const NOTIFICATION_PREFERENCE_FIELDS =
  'notifications_enabled, payment, message, maintenance, apartment, system';

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

export async function fetchNotifications(userId: string, limit = 50): Promise<NotificationItem[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, user_id, type, title, message, data, is_read, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []) as NotificationItem[];
}

export async function fetchUnreadNotificationCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) throw error;

  return count ?? 0;
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) throw error;
}

export async function upsertPushToken(userId: string, token: string, platform: string): Promise<PushTokenRow | null> {
  const { data, error } = await supabase
    .from('push_tokens')
    .upsert(
      { user_id: userId, token, platform, updated_at: new Date().toISOString() },
      { onConflict: 'token' },
    )
    .select('*')
    .single();

  if (error) throw error;

  return data;
}

export async function deletePushToken(token: string): Promise<void> {
  const { error } = await supabase.from('push_tokens').delete().eq('token', token);

  if (error) throw error;
}
