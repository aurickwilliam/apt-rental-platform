import { useCallback, useEffect, useRef } from 'react';

import { supabase } from '@repo/supabase';
import { getRelativeTime } from '@repo/utils';

import { buildConversationKey, type Message, type MessageType, type ReplyPreview } from '../../service/chat/chatService';

type PresenceState = {
  userId: string;
  isTyping: boolean;
  lastTypedAt?: number;
};

type BroadcastPayload = {
  id: string;
  message: string | null;
  messageType: MessageType;
  attachmentUrl: string | null;
  attachmentPath: string | null;
  attachmentMimeType?: string | null;
  thumbnailUrl?: string | null;
  thumbnailPath?: string | null;
  created_at: string;
  sender_id: string;
  apartment_id: string | null;
  reply_to?: string | null;
  reply_message?: string | null;
  reply_message_type?: MessageType | null;
  reply_sender_id?: string | null;
};

export type ReactionBroadcast = {
  messageId: string;
  /** Null when the reaction was removed. */
  emoji: string | null;
  sender_id: string;
  apartment_id: string | null;
};

type UseChatChannelOptions = {
  currentUserId: string | null;
  otherUserId: string;
  apartmentId: string | null;
  onNewMessage: (msg: Message) => void;
  onOtherUserTypingChange: (isTyping: boolean) => void;
  onMessageDeleted?: (id: string) => void;
  onReactionChange?: (reaction: ReactionBroadcast) => void;
};

type BroadcastEvent = { payload: BroadcastPayload };
type DeletePayload = { id: string; apartment_id: string | null };
type DeleteEvent = { payload: DeletePayload };
type ReactionEvent = { payload: ReactionBroadcast };
type PresenceJoinEvent = { key: string; newPresences: PresenceState[] };
type PresenceLeaveEvent = { key: string };

export function useChatChannel({
  currentUserId,
  otherUserId,
  apartmentId,
  onNewMessage,
  onOtherUserTypingChange,
  onMessageDeleted,
  onReactionChange,
}: UseChatChannelOptions) {
  const msgChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isSubscribedRef = useRef(false);
  const onNewMessageRef = useRef(onNewMessage);
  const onOtherUserTypingChangeRef = useRef(onOtherUserTypingChange);
  const onMessageDeletedRef = useRef(onMessageDeleted);
  const onReactionChangeRef = useRef(onReactionChange);

  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
  }, [onNewMessage]);

  useEffect(() => {
    onOtherUserTypingChangeRef.current = onOtherUserTypingChange;
  }, [onOtherUserTypingChange]);

  useEffect(() => {
    onMessageDeletedRef.current = onMessageDeleted;
  }, [onMessageDeleted]);

  useEffect(() => {
    onReactionChangeRef.current = onReactionChange;
  }, [onReactionChange]);

  const teardown = useCallback(() => {
    if (msgChannelRef.current) {
      supabase.removeChannel(msgChannelRef.current);
      msgChannelRef.current = null;
    }
    if (presenceChannelRef.current) {
      supabase.removeChannel(presenceChannelRef.current);
      presenceChannelRef.current = null;
    }
    isSubscribedRef.current = false;
  }, []);

  useEffect(() => {
    if (!currentUserId || !otherUserId) return;

    const conversationKey = buildConversationKey(currentUserId, otherUserId, apartmentId);
    let cancelled = false;
    let presenceTrackTimeout: ReturnType<typeof setTimeout> | null = null;
    let msgChannel: ReturnType<typeof supabase.channel> | null = null;
    let presenceChannel: ReturnType<typeof supabase.channel> | null = null;

    const findRegisteredChannel = (name: string) =>
      supabase
        .getChannels()
        .find((channel) => channel.topic === `realtime:${name}`);

    void (async () => {
      // removeChannel is async: a previous instance for this conversation may
      // still be unregistering (StrictMode remount, fast back-and-reopen).
      // supabase.channel() would return that stale joined channel and
      // .on('presence') would throw "cannot add presence callbacks after
      // subscribe()". Drain first so creation always yields a fresh object.
      for (const name of [
        `chat:msg:${conversationKey}`,
        `chat:presence:${conversationKey}`,
      ]) {
        const stale = findRegisteredChannel(name);
        if (stale) await supabase.removeChannel(stale);
      }
      if (cancelled) return;

      msgChannel = supabase.channel(`chat:msg:${conversationKey}`);
      presenceChannel = supabase.channel(`chat:presence:${conversationKey}`, {
        config: { presence: { key: currentUserId } },
      });
      if (!msgChannel || !presenceChannel) return;
      // Const aliases for the closures below (TS can't narrow the lets).
      const msg = msgChannel;
      const presence = presenceChannel;

      msg
        .on('broadcast', { event: 'new_message' }, ({ payload }: BroadcastEvent) => {
          if (payload.sender_id === currentUserId) return;

          const matchesApartment = apartmentId
            ? payload.apartment_id === apartmentId
            : payload.apartment_id == null;
          if (!matchesApartment) return;

          let replyTo: ReplyPreview | null = null;
          let replyDeleted: boolean | undefined;
          if (payload.reply_to) {
            if (payload.reply_message !== undefined) {
              // Snapshot included in broadcast (text placeholder for media).
              if (payload.reply_message !== null || payload.reply_message_type) {
                replyTo = {
                  id: payload.reply_to,
                  message: payload.reply_message ?? null,
                  messageType: (payload.reply_message_type ?? 'text') as MessageType,
                  senderId: payload.reply_sender_id ?? '',
                  isSent: payload.reply_sender_id === currentUserId,
                };
              } else {
                replyDeleted = true;
              }
            } else {
              // Legacy broadcast without snapshot — will be resolved on next fetch.
              replyDeleted = true;
            }
          }

          onNewMessageRef.current({
            id: payload.id,
            message: payload.message,
            messageType: payload.messageType ?? 'text',
            attachmentUrl: payload.attachmentUrl ?? null,
            attachmentPath: payload.attachmentPath ?? null,
            attachmentMimeType: payload.attachmentMimeType ?? null,
            thumbnailUrl: payload.thumbnailUrl ?? null,
            thumbnailPath: payload.thumbnailPath ?? null,
            timestamp: getRelativeTime(new Date(payload.created_at)),
            createdAt: payload.created_at,
            isSent: false,
            replyTo,
            replyDeleted,
            reactions: [],
          });
        })
        .on('broadcast', { event: 'message_deleted' }, ({ payload }: DeleteEvent) => {
          // apartment filter: only process if it belongs to this conversation's apartment
          if (apartmentId !== null) {
            if (payload.apartment_id !== apartmentId) return;
          } else if (payload.apartment_id != null) return;
          if (!payload.id) return;
          onMessageDeletedRef.current?.(payload.id);
        })
        .on('broadcast', { event: 'message_reacted' }, ({ payload }: ReactionEvent) => {
          if (payload.sender_id === currentUserId) return;
          if (!payload.messageId) return;
          if (apartmentId !== null) {
            if (payload.apartment_id !== apartmentId) return;
          } else if (payload.apartment_id != null) return;
          onReactionChangeRef.current?.(payload);
        })
        .on('broadcast', { event: 'reaction_removed' }, ({ payload }: ReactionEvent) => {
          if (payload.sender_id === currentUserId) return;
          if (!payload.messageId) return;
          if (apartmentId !== null) {
            if (payload.apartment_id !== apartmentId) return;
          } else if (payload.apartment_id != null) return;
          onReactionChangeRef.current?.({ ...payload, emoji: null });
        })
        .subscribe((status) => {
          if (msgChannelRef.current === msg) {
            isSubscribedRef.current = status === 'SUBSCRIBED';
          }
        });

      const resolveOtherTyping = (state: Record<string, PresenceState[]>) => {
        const otherEntry = state[otherUserId];
        if (!Array.isArray(otherEntry)) return false;

        return otherEntry.some((entry) => {
          const isFresh = Boolean(
            entry.lastTypedAt && Date.now() - entry.lastTypedAt < 5000
          );
          return entry.isTyping && isFresh;
        });
      };

      presence
        .on('presence', { event: 'sync' }, () => {
          onOtherUserTypingChangeRef.current(
            resolveOtherTyping(presence.presenceState<PresenceState>())
          );
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }: PresenceJoinEvent) => {
          if (key === otherUserId) {
            onOtherUserTypingChangeRef.current(
              newPresences.some((entry) => entry.isTyping)
            );
          }
        })
        .on('presence', { event: 'leave' }, ({ key }: PresenceLeaveEvent) => {
          if (key === otherUserId) onOtherUserTypingChangeRef.current(false);
        })
        .subscribe((status) => {
          if (status !== 'SUBSCRIBED') return;

          presenceTrackTimeout = setTimeout(() => {
            presence.track({
              userId: currentUserId,
              isTyping: false,
              lastTypedAt: Date.now(),
            });
          }, 100);
        });

      msgChannelRef.current = msg;
      presenceChannelRef.current = presence;
    })();

    return () => {
      cancelled = true;
      if (presenceTrackTimeout) clearTimeout(presenceTrackTimeout);
      // msgChannel/presenceChannel are null when unmounting before the async
      // setup finished — in that case there is nothing of ours to remove
      // (the drain already took care of any stale predecessor).
      if (msgChannel && msgChannelRef.current === msgChannel) {
        supabase.removeChannel(msgChannel);
        msgChannelRef.current = null;
        isSubscribedRef.current = false;
      }
      if (presenceChannel && presenceChannelRef.current === presenceChannel) {
        supabase.removeChannel(presenceChannel);
        presenceChannelRef.current = null;
      }
    };
  }, [apartmentId, currentUserId, otherUserId]);

  /** Broadcasts an already-inserted message to the other user. */
  const broadcast = useCallback((payload: BroadcastPayload) => {
    if (!isSubscribedRef.current || !msgChannelRef.current) return;

    msgChannelRef.current.send({
      type: 'broadcast',
      event: 'new_message',
      payload,
    });
  }, []);

  const broadcastDelete = useCallback(
    (payload: DeletePayload) => {
      if (!isSubscribedRef.current || !msgChannelRef.current) return;
      msgChannelRef.current.send({
        type: 'broadcast',
        event: 'message_deleted',
        payload,
      });
    },
    []
  );

  const broadcastReaction = useCallback((payload: ReactionBroadcast) => {
    if (!isSubscribedRef.current || !msgChannelRef.current) return;
    msgChannelRef.current.send({
      type: 'broadcast',
      event: payload.emoji === null ? 'reaction_removed' : 'message_reacted',
      payload,
    });
  }, []);

  /** Tracks the current user's presence state (typing / not typing). */
  const trackPresence = useCallback((currentUserId: string, isTyping: boolean) => {
    presenceChannelRef.current?.track({
      userId: currentUserId,
      isTyping,
      lastTypedAt: Date.now(),
    });
  }, []);

  return { teardown, broadcast, broadcastDelete, broadcastReaction, trackPresence };
}
