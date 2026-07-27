import { useState, useRef, useEffect, useCallback } from 'react';

import {
  getCurrentUserProfile,
  fetchMessages,
  fetchOtherUserProfile,
  insertMessage,
  markMessagesAsRead,
  buildConversationKey,
  resolveMessageType,
  sendChatAttachments,
  type Message,
  type PickedChatAsset,
} from '../../service/chatService';

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

  const handleStartTyping = useCallback(() => {
    if (myIdRef.current) trackPresence(myIdRef.current, true);
  }, [trackPresence]);

  const handleStopTyping = useCallback(() => {
    if (myIdRef.current) trackPresence(myIdRef.current, false);
  }, [trackPresence]);

  const handleHeartbeat = useCallback(() => {
    if (myIdRef.current) trackPresence(myIdRef.current, true);
  }, [trackPresence]);

  const {
    onTextChange: onTypingTextChange,
    stop: stopTyping,
    cleanup: cleanupTyping,
  } = useChatTyping({
    onStartTyping: handleStartTyping,
    onStopTyping: handleStopTyping,
    onHeartbeat: handleHeartbeat,
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
      messageType: 'text',
      attachmentUrl: null,
      attachmentPath: null,
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
        messageType: 'text',
        attachmentUrl: null,
        attachmentPath: null,
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
        messageType: 'text',
        attachmentUrl: null,
        attachmentPath: null,
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

  const handleSendImages = useCallback(
    async (assets: PickedChatAsset[]) => {
      stopTyping();
      if (!myId || !otherUserId || sending || assets.length === 0) return;

      const groupId = assets.length > 1 ? `pending-${Date.now()}` : null;
      const tempIdByUri = new Map(assets.map((a) => [a.localUri, `temp-${Date.now()}-${Math.random()}`]));

      const pendingMsgs: Message[] = assets.map((a) => ({
        id: tempIdByUri.get(a.localUri)!,
        message: null,
        messageType: resolveMessageType(a.mimeType),
        attachmentUrl: a.localUri,   // local file:// renders immediately, no signed URL needed yet
        attachmentPath: null,
        attachmentMimeType: a.mimeType ?? null,
        thumbnailUrl: null,
        groupId,
        timestamp: 'Sending...',
        isSent: true,
        isPending: true,
      }));

      setMessages((prev) => [...pendingMsgs, ...prev]);
      setSending(true);

      try {
        const { sent, failed } = await sendChatAttachments({
          senderId: myId,
          receiverId: otherUserId,
          apartmentId,
          assets,
        });

        setMessages((prev) => {
          let next = prev;

          for (const msg of sent) {
            const tempId = tempIdByUri.get(msg.localUri);
            const idx = next.findIndex((m) => m.id === tempId);
            if (idx !== -1) {
              const copy = [...next];
              copy[idx] = msg;
              next = copy;
            }
          }

          const failedTempIds = new Set(
            failed
              .map((f) => tempIdByUri.get(f.localUri))
              .filter((id): id is string => !!id)
          );

          if (failedTempIds.size > 0) {
            next = next.filter((m) => !failedTempIds.has(m.id));
          }

          return next;
        });

        for (const msg of sent) {
          broadcast({
            id: msg.id,
            message: null,
            messageType: msg.messageType,
            attachmentUrl: msg.attachmentUrl,
            attachmentPath: msg.attachmentPath,
            attachmentMimeType: msg.attachmentMimeType,
            thumbnailUrl: msg.thumbnailUrl,
            thumbnailPath: msg.thumbnailPath,
            created_at: new Date().toISOString(),
            sender_id: myId,
            apartment_id: apartmentId,
          });
        }
      } catch (err) {
        console.error('Batch attachment send failed:', err);
        setMessages((prev) => prev.filter((m) => !tempIdByUri.has(m.attachmentUrl ?? '')));
      } finally {
        setSending(false);
      }
    },
    [apartmentId, broadcast, myId, otherUserId, sending, stopTyping]
  );

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
    handleSendImages,
  };
}
