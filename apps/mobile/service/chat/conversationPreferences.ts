// Pure (no Supabase import) so list helpers and tests can use it directly.

/** The caller's own settings for a conversation (get_portal_conversations). */
export type ConversationPreferences = {
  is_pinned: boolean;
  pinned_at: string | null;
  is_archived: boolean;
  is_muted: boolean;
  marked_unread: boolean;
  /** The caller blocked the other person (messaging is closed both ways). */
  blocked_by_me: boolean;
};

export const DEFAULT_CONVERSATION_PREFERENCES: ConversationPreferences = {
  is_pinned: false,
  pinned_at: null,
  is_archived: false,
  is_muted: false,
  marked_unread: false,
  blocked_by_me: false,
};
