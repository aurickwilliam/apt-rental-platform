import { supabase } from '@repo/supabase';
import { getRelativeTime } from '@repo/utils';

export type Message = {
  id: string;
  message: string;
  timestamp: string;
  isSent: boolean;
  isPending?: boolean;
};

export type UserProfile = {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
};

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function getCurrentUserProfile(): Promise<{ id: string } | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('user_id', user.id)
    .single();

  return data ?? null;
}

// ─── Messages ────────────────────────────────────────────────────────────────

export async function fetchMessages(
  currentUserId: string,
  otherUserId: string,
  apartmentId: string | null
): Promise<Message[]> {
  let query = supabase
    .from('chat')
    .select('id, message, created_at, sender_id, receiver_id, apartment_id')
    .or(
      `and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`
    )
    .order('created_at', { ascending: false });

  query = apartmentId ? query.eq('apartment_id', apartmentId) : query.is('apartment_id', null);

  const { data, error } = await query;
  if (error) throw error;

  return mapMessages(data ?? [], currentUserId);
}

export async function insertMessage(params: {
  senderId: string;
  receiverId: string;
  message: string;
  apartmentId: string | null;
}) {
  // Guard for Null Apartment ID
  // For ensuring that apartment ID is always provided for tenant-landlord conversations
  // and always null for inquiry conversations
  if (!params.apartmentId) {
    throw new Error('Chat requires apartmentId');
  }

  const { data, error } = await supabase
    .from('chat')
    .insert({
      sender_id: params.senderId,
      receiver_id: params.receiverId,
      message: params.message,
      apartment_id: params.apartmentId,
      is_read: false,
    })
    .select('id, message, created_at, sender_id')
    .single();

  if (error) throw error;
  return data;
}

export async function markMessagesAsRead(
  currentUserId: string,
  otherUserId: string,
  apartmentId: string | null
) {
  let query = supabase
    .from('chat')
    .update({ is_read: true })
    .eq('receiver_id', currentUserId)
    .eq('sender_id', otherUserId)
    .eq('is_read', false);

  query = apartmentId ? query.eq('apartment_id', apartmentId) : query.is('apartment_id', null);

  const { error } = await query;
  if (error) throw error;
}

// ─── Conversations ────────────────────────────────────────────────────────────

export type Conversation = {
  conversation_key: string;
  other_user_id: string;
  other_user_name: string;
  other_user_avatar: string | null;
  other_user_phone: string | null;
  apartment_id: string | null;
  apartment_name: string | null;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  conversation_type: 'tenant' | 'inquiry';
};

export async function getConversations(userId: string): Promise<Conversation[]> {
  const { data, error } = await supabase.rpc('get_conversations', {
    p_user_id: userId,
  });

  if (error) throw error;

  return (data as Conversation[]).sort(
    (a, b) =>
      new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime()
  );
}

// ─── User profile ─────────────────────────────────────────────────────────────

export async function fetchOtherUserProfile(otherUserId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('users')
    .select('id, first_name, last_name, avatar_url')
    .eq('id', otherUserId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    firstName: data.first_name ?? '',
    lastName: data.last_name ?? '',
    avatarUrl: data.avatar_url ?? null,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function mapMessages(rows: any[], currentUserId: string): Message[] {
  return rows.map((m) => ({
    id: m.id,
    message: m.message,
    timestamp: getRelativeTime(new Date(m.created_at)),
    isSent: m.sender_id === currentUserId,
  }));
}

export function buildConversationKey(
  userAId: string,
  userBId: string,
  apartmentId: string | null
) {
  const [first, second] = [userAId, userBId].sort();
  return `chat:${apartmentId ?? 'none'}:${first}:${second}`;
}