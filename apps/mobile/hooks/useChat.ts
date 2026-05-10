import { useState, useRef, useEffect, useCallback } from 'react';

import {
  getCurrentUserProfile,
  fetchMessages,
  fetchOtherUserProfile,
  insertMessage,
  markMessagesAsRead,
  buildConversationKey,
  type Message,
} from '../service/chatService';

import { useChatChannel } from './useChatChannel';
import { useChatTyping } from './useChatTyping';

type Options = {
  conversationId: string;
  otherUserId: string;
  apartmentId: string | null;
  initialOtherUserName?: string;
  initialOtherUserAvatar?: string | null;
};

export function useChat({
  conversationId: _conversationId,
  otherUserId,
  apartmentId,
  initialOtherUserName,
  initialOtherUserAvatar,
}: Options) {
  const [myId, setMyId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatMessage, setChatMessage] = useState('');
  const [otherUserName, setOtherUserName] = useState(initialOtherUserName ?? 'User');
  const [otherUserAvatar, setOtherUserAvatar] = useState<string | null>(
    initialOtherUserAvatar ?? null
  );
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUserIsTyping, setOtherUserIsTyping] = useState(false);

  // Keep myId accessible in callbacks without causing re-subscriptions
  const myIdRef = useRef<string | null>(null);

  // ─── Realtime channel ───────────────────────────────────────────────────────

  const handleNewMessage = useCallback((msg: Message) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [msg, ...prev];
    });
  }, []);

  const handleOtherUserTypingChange = useCallback((isTyping: boolean) => {
    setOtherUserIsTyping((prev) => (prev === isTyping ? prev : isTyping));
  }, []);

  const { setup, teardown, broadcast, trackPresence } = useChatChannel({
    otherUserId,
    apartmentId,
    onNewMessage: handleNewMessage,
    onOtherUserTypingChange: handleOtherUserTypingChange,
  });

  // ─── Typing indicators ──────────────────────────────────────────────────────

  const { onTextChange: onTypingTextChange, stop: stopTyping, cleanup: cleanupTyping } = useChatTyping({
    onStartTyping: () => {
      if (myIdRef.current) trackPresence(myIdRef.current, true);
    },
    onStopTyping: () => {
      if (myIdRef.current) trackPresence(myIdRef.current, false);
    },
    onHeartbeat: () => {
      if (myIdRef.current) trackPresence(myIdRef.current, true);
    },
  });

  // ─── Handlers exposed to the screen ────────────────────────────────────────

  const handleChatMessageChange = useCallback(
    (text: string) => {
      setChatMessage(text);
      onTypingTextChange();
    },
    [onTypingTextChange]
  );

  const handleInputBlur = useCallback(() => {
    stopTyping();
  }, [stopTyping]);

  const handleSend = useCallback(async () => {
    stopTyping();

    if (!chatMessage.trim() || !myId || !otherUserId || sending) return;

    const text = chatMessage.trim();
    const tempId = `temp-${Date.now()}`;

    const pendingMsg: Message = {
      id: tempId,
      message: text,
      timestamp: 'Sending...',
      isSent: true,
      isPending: true,
    };

    setMessages((prev) => [pendingMsg, ...prev]);
    setChatMessage('');
    setSending(true);

    try {
      const inserted = await insertMessage({
        senderId: myId,
        receiverId: otherUserId,
        message: text,
        apartmentId,
      });

      const sentMsg: Message = {
        id: inserted.id,
        message: inserted.message,
        timestamp: new Date(inserted.created_at).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        isSent: true,
      };

      setMessages((prev) => {
        if (prev.some((m) => m.id === sentMsg.id)) {
          return prev.filter((m) => m.id !== tempId);
        }
        const pendingIndex = prev.findIndex((m) => m.id === tempId);
        if (pendingIndex !== -1) {
          const next = [...prev];
          next[pendingIndex] = sentMsg;
          return next;
        }
        return [sentMsg, ...prev];
      });

      broadcast({
        id: inserted.id,
        message: inserted.message,
        created_at: inserted.created_at,
        sender_id: myId,
        apartment_id: apartmentId,
      });
    } catch (err) {
      console.error('Send failed:', err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setChatMessage(text);
    } finally {
      setSending(false);
    }
  }, [apartmentId, broadcast, chatMessage, myId, otherUserId, sending, stopTyping]);

  // ─── Init ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const profile = await getCurrentUserProfile();
        if (!profile || cancelled) return;

        myIdRef.current = profile.id;
        setMyId(profile.id);

        const [otherProfile, msgs] = await Promise.all([
          fetchOtherUserProfile(otherUserId),
          fetchMessages(profile.id, otherUserId, apartmentId),
        ]);

        if (cancelled) return;

        if (otherProfile) {
          if (!initialOtherUserName) {
            const fullName = `${otherProfile.firstName} ${otherProfile.lastName}`.trim();
            if (fullName) setOtherUserName(fullName);
          }
          if (!initialOtherUserAvatar && otherProfile.avatarUrl) {
            setOtherUserAvatar(otherProfile.avatarUrl);
          }
        }

        setMessages(msgs);
        markMessagesAsRead(profile.id, otherUserId, apartmentId).catch(console.error);
        const channelKey = buildConversationKey(profile.id, otherUserId, apartmentId);
        setup(profile.id, channelKey);
      } catch (err) {
        console.error('Chat init error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();

    return () => {
      cancelled = true;
      stopTyping();
      cleanupTyping();
      teardown();
    };
  }, [
    apartmentId,
    cleanupTyping,
    initialOtherUserAvatar,
    initialOtherUserName,
    otherUserId,
    setup,
    stopTyping,
    teardown,
  ]);

  return {
    // State
    myId,
    messages,
    chatMessage,
    otherUserName,
    otherUserAvatar,
    loading,
    sending,
    otherUserIsTyping,
    // Handlers
    handleChatMessageChange,
    handleSend,
    handleInputBlur,
  };
}