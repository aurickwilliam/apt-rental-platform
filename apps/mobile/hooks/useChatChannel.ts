import { useRef, useCallback } from 'react';
import { supabase } from '@repo/supabase';
import { getRelativeTime } from '@repo/utils';
import type { Message } from '../service/chatService';

type PresenceState = {
  userId: string;
  isTyping: boolean;
  lastTypedAt?: number;
};

type UseChatChannelOptions = {
  otherUserId: string;
  apartmentId: string | null;
  onNewMessage: (msg: Message) => void;
  onOtherUserTypingChange: (isTyping: boolean) => void;
};

export function useChatChannel({
  otherUserId,
  apartmentId,
  onNewMessage,
  onOtherUserTypingChange,
}: UseChatChannelOptions) {
  const msgChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isSubscribedRef = useRef(false);

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

  const setup = useCallback(
    (currentUserId: string, conversationKey: string) => {
      teardown();

      // ── Broadcast channel (incoming messages) ────────────────────────────
      const msgChannel = supabase.channel(`chat:msg:${conversationKey}`);

      msgChannel
        .on('broadcast', { event: 'new_message' }, ({ payload }) => {
          if (payload.sender_id === currentUserId) return;

          const matchesApartment = apartmentId
            ? payload.apartment_id === apartmentId
            : payload.apartment_id == null;

          if (!matchesApartment) return;

          onNewMessage({
            id: payload.id,
            message: payload.message,
            timestamp: getRelativeTime(new Date(payload.created_at)),
            isSent: false,
          });
        })
        .subscribe((status) => {
          isSubscribedRef.current = status === 'SUBSCRIBED';
        });

      msgChannelRef.current = msgChannel;

      // ── Presence channel (typing indicators) ─────────────────────────────
      const presenceChannel = supabase.channel(`chat:presence:${conversationKey}`, {
        config: { presence: { key: currentUserId } },
      });

      const resolveOtherTyping = (state: Record<string, any[]>) => {
        const otherEntry = Object.entries(state).find(([key]) => key === otherUserId)?.[1];
        if (!Array.isArray(otherEntry)) return false;

        return otherEntry.some((p: PresenceState) => {
          const isFresh = p.lastTypedAt && Date.now() - p.lastTypedAt < 5000;
          return p.isTyping === true && isFresh;
        });
      };

      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannel.presenceState<PresenceState>();
          onOtherUserTypingChange(resolveOtherTyping(state));
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          if (key === otherUserId) {
            onOtherUserTypingChange(newPresences.some((p: any) => p.isTyping === true));
          }
        })
        .on('presence', { event: 'leave' }, ({ key }) => {
          if (key === otherUserId) onOtherUserTypingChange(false);
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setTimeout(() => {
              presenceChannel.track({
                userId: currentUserId,
                isTyping: false,
                lastTypedAt: Date.now(),
              });
            }, 100);
          }
        });

      presenceChannelRef.current = presenceChannel;
    },
    [apartmentId, otherUserId, onNewMessage, onOtherUserTypingChange, teardown]
  );

  /** Broadcasts an already-inserted message to the other user. */
  const broadcast = useCallback(
    (payload: {
      id: string;
      message: string;
      created_at: string;
      sender_id: string;
      apartment_id: string | null;
    }) => {
      if (!isSubscribedRef.current || !msgChannelRef.current) return;

      msgChannelRef.current.send({
        type: 'broadcast',
        event: 'new_message',
        payload,
      });
    },
    []
  );

  /** Tracks the current user's presence state (typing / not typing). */
  const trackPresence = useCallback(
    (currentUserId: string, isTyping: boolean) => {
      presenceChannelRef.current?.track({
        userId: currentUserId,
        isTyping,
        lastTypedAt: Date.now(),
      });
    },
    []
  );

  return { setup, teardown, broadcast, trackPresence };
}