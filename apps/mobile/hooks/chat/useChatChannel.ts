import { useCallback, useEffect, useRef } from 'react';

import { supabase } from '@repo/supabase';
import { getRelativeTime } from '@repo/utils';

import { buildConversationKey, type Message, type MessageType } from '../../service/chat/chatService';

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
};

type UseChatChannelOptions = {
  currentUserId: string | null;
  otherUserId: string;
  apartmentId: string | null;
  onNewMessage: (msg: Message) => void;
  onOtherUserTypingChange: (isTyping: boolean) => void;
};

type BroadcastEvent = { payload: BroadcastPayload };
type PresenceJoinEvent = { key: string; newPresences: PresenceState[] };
type PresenceLeaveEvent = { key: string };

export function useChatChannel({
  currentUserId,
  otherUserId,
  apartmentId,
  onNewMessage,
  onOtherUserTypingChange,
}: UseChatChannelOptions) {
  const msgChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isSubscribedRef = useRef(false);
  const onNewMessageRef = useRef(onNewMessage);
  const onOtherUserTypingChangeRef = useRef(onOtherUserTypingChange);

  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
  }, [onNewMessage]);

  useEffect(() => {
    onOtherUserTypingChangeRef.current = onOtherUserTypingChange;
  }, [onOtherUserTypingChange]);

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
    const msgChannel = supabase.channel(`chat:msg:${conversationKey}`);
    const presenceChannel = supabase.channel(`chat:presence:${conversationKey}`, {
      config: { presence: { key: currentUserId } },
    });
    let presenceTrackTimeout: ReturnType<typeof setTimeout> | null = null;

    msgChannel
      .on('broadcast', { event: 'new_message' }, ({ payload }: BroadcastEvent) => {
        if (payload.sender_id === currentUserId) return;

        const matchesApartment = apartmentId
          ? payload.apartment_id === apartmentId
          : payload.apartment_id == null;
        if (!matchesApartment) return;

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
          isSent: false,
        });
      })
      .subscribe((status) => {
        if (msgChannelRef.current === msgChannel) {
          isSubscribedRef.current = status === 'SUBSCRIBED';
        }
      });

    const resolveOtherTyping = (state: Record<string, PresenceState[]>) => {
      const otherEntry = state[otherUserId];
      if (!Array.isArray(otherEntry)) return false;

      return otherEntry.some((presence) => {
        const isFresh = Boolean(
          presence.lastTypedAt && Date.now() - presence.lastTypedAt < 5000
        );
        return presence.isTyping && isFresh;
      });
    };

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        onOtherUserTypingChangeRef.current(
          resolveOtherTyping(presenceChannel.presenceState<PresenceState>())
        );
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }: PresenceJoinEvent) => {
        if (key === otherUserId) {
          onOtherUserTypingChangeRef.current(
            newPresences.some((presence) => presence.isTyping)
          );
        }
      })
      .on('presence', { event: 'leave' }, ({ key }: PresenceLeaveEvent) => {
        if (key === otherUserId) onOtherUserTypingChangeRef.current(false);
      })
      .subscribe((status) => {
        if (status !== 'SUBSCRIBED') return;

        presenceTrackTimeout = setTimeout(() => {
          presenceChannel.track({
            userId: currentUserId,
            isTyping: false,
            lastTypedAt: Date.now(),
          });
        }, 100);
      });

    msgChannelRef.current = msgChannel;
    presenceChannelRef.current = presenceChannel;

    return () => {
      if (presenceTrackTimeout) clearTimeout(presenceTrackTimeout);
      if (msgChannelRef.current === msgChannel) {
        supabase.removeChannel(msgChannel);
        msgChannelRef.current = null;
        isSubscribedRef.current = false;
      }
      if (presenceChannelRef.current === presenceChannel) {
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

  /** Tracks the current user's presence state (typing / not typing). */
  const trackPresence = useCallback((currentUserId: string, isTyping: boolean) => {
    presenceChannelRef.current?.track({
      userId: currentUserId,
      isTyping,
      lastTypedAt: Date.now(),
    });
  }, []);

  return { teardown, broadcast, trackPresence };
}
