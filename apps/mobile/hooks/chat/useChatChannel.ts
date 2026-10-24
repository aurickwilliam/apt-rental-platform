import { useCallback, useEffect, useRef } from 'react';

import { supabase } from '@repo/supabase';
import { getRelativeTime } from '@repo/utils';

import { buildConversationKey, type Message, type MessageType, type ReplyPreview } from '../../service/chat/chatService';

/** How long a typing Broadcast stays on until a fresh or stopping one arrives. */
const TYPING_FRESH_WINDOW_MS = 5000;

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
  reply_preview_url?: string | null;
};

export type ReactionBroadcast = {
  messageId: string;
  /** Null when the reaction was removed. */
  emoji: string | null;
  sender_id: string;
  apartment_id: string | null;
};

/** The reader saw every message up to `read_up_to` (that message's created_at). */
export type ReadBroadcast = {
  reader_id: string;
  apartment_id: string | null;
  read_up_to: string;
};

type UseChatChannelOptions = {
  currentUserId: string | null;
  otherUserId: string;
  apartmentId: string | null;
  onNewMessage: (msg: Message) => void;
  onOtherUserTypingChange: (isTyping: boolean) => void;
  onMessageDeleted?: (id: string) => void;
  onReactionChange?: (reaction: ReactionBroadcast) => void;
  /** The other user read this conversation up to a message's created_at. */
  onMessagesRead?: (readUpTo: string) => void;
};

type BroadcastEvent = { payload: BroadcastPayload };
type DeletePayload = { id: string; apartment_id: string | null };
type DeleteEvent = { payload: DeletePayload };
type ReactionEvent = { payload: ReactionBroadcast };
type ReadEvent = { payload: ReadBroadcast };
type TypingPayload = { userId: string; isTyping: boolean };
type TypingEvent = { payload: TypingPayload };

export function useChatChannel({
  currentUserId,
  otherUserId,
  apartmentId,
  onNewMessage,
  onOtherUserTypingChange,
  onMessageDeleted,
  onReactionChange,
  onMessagesRead,
}: UseChatChannelOptions) {
  const msgChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isSubscribedRef = useRef(false);
  const onNewMessageRef = useRef(onNewMessage);
  const onOtherUserTypingChangeRef = useRef(onOtherUserTypingChange);
  const onMessageDeletedRef = useRef(onMessageDeleted);
  const onReactionChangeRef = useRef(onReactionChange);
  const onMessagesReadRef = useRef(onMessagesRead);

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

  useEffect(() => {
    onMessagesReadRef.current = onMessagesRead;
  }, [onMessagesRead]);

  const teardown = useCallback(() => {
    if (msgChannelRef.current) {
      supabase.removeChannel(msgChannelRef.current);
      msgChannelRef.current = null;
    }
    isSubscribedRef.current = false;
  }, []);

  useEffect(() => {
    if (!currentUserId || !otherUserId) return;

    const conversationKey = buildConversationKey(currentUserId, otherUserId, apartmentId);
    let cancelled = false;
    let typingClearTimeout: ReturnType<typeof setTimeout> | null = null;
    let msgChannel: ReturnType<typeof supabase.channel> | null = null;

    const findRegisteredChannel = (name: string) =>
      supabase
        .getChannels()
        .find((channel) => channel.topic === `realtime:${name}`);

    void (async () => {
      // removeChannel is async: a previous instance for this conversation may
      // still be unregistering (StrictMode remount, fast back-and-reopen).
      // supabase.channel() returns that stale joined channel, and new
      // bindings throw after subscribe(). Drain first so creation always
      // yields a fresh object.
      for (const name of [`chat:msg:${conversationKey}`]) {
        const stale = findRegisteredChannel(name);
        if (stale) await supabase.removeChannel(stale);
      }
      if (cancelled) return;

      msgChannel = supabase.channel(`chat:msg:${conversationKey}`);
      if (!msgChannel) return;
      // Const alias for the closures below (TS can't narrow the lets).
      const msg = msgChannel;

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
                  previewUrl: payload.reply_preview_url ?? null,
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
        .on('broadcast', { event: 'messages_read' }, ({ payload }: ReadEvent) => {
          if (payload.reader_id === currentUserId || !payload.read_up_to) return;
          if (apartmentId !== null) {
            if (payload.apartment_id !== apartmentId) return;
          } else if (payload.apartment_id != null) return;
          onMessagesReadRef.current?.(payload.read_up_to);
        })
        .on('broadcast', { event: 'typing' }, ({ payload }: TypingEvent) => {
          if (!payload || payload.userId === currentUserId) return;
          const isTyping = payload.isTyping === true;
          if (typingClearTimeout) {
            clearTimeout(typingClearTimeout);
            typingClearTimeout = null;
          }
          onOtherUserTypingChangeRef.current(isTyping);
          // A lost "stop" can never leave the indicator stuck.
          if (isTyping) {
            typingClearTimeout = setTimeout(() => {
              typingClearTimeout = null;
              onOtherUserTypingChangeRef.current(false);
            }, TYPING_FRESH_WINDOW_MS);
          }
        })
        .subscribe((status) => {
          if (msgChannelRef.current === msg) {
            isSubscribedRef.current = status === 'SUBSCRIBED';
          }
        });

      msgChannelRef.current = msg;
    })();

    return () => {
      cancelled = true;
      if (typingClearTimeout) {
        clearTimeout(typingClearTimeout);
        typingClearTimeout = null;
      }
      // msgChannel is null when unmounting before the async setup finished —
      // in that case there is nothing of ours to remove (the drain already
      // took care of any stale predecessor).
      if (msgChannel && msgChannelRef.current === msgChannel) {
        supabase.removeChannel(msgChannel);
        msgChannelRef.current = null;
        isSubscribedRef.current = false;
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

  /** Tells the other user's open chat how far this user has read. */
  const broadcastRead = useCallback((payload: ReadBroadcast) => {
    if (!isSubscribedRef.current || !msgChannelRef.current) return;
    msgChannelRef.current.send({ type: 'broadcast', event: 'messages_read', payload });
  }, []);

  /**
   * Broadcasts the current user's typing state on the message channel.
   * Presence was removed on purpose: its client-side limit (5 updates per
   * 30 s) closed the presence channel while someone typed normally.
   */
  const broadcastTyping = useCallback((currentUserId: string, isTyping: boolean) => {
    if (!isSubscribedRef.current || !msgChannelRef.current) return;
    msgChannelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: currentUserId, isTyping },
    });
  }, []);

  return { teardown, broadcast, broadcastDelete, broadcastReaction, broadcastRead, broadcastTyping };
}
