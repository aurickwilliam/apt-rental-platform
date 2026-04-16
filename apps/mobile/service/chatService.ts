import { supabase } from '@repo/supabase';

export type Conversation = {
  conversation_key: string;
  other_user_id: string;
  other_user_name: string;
  other_user_avatar: string | null;
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

  // Sort client-side by most recent message first
  return (data as Conversation[]).sort(
    (a, b) =>
      new Date(b.last_message_time).getTime() -
      new Date(a.last_message_time).getTime()
  );
}