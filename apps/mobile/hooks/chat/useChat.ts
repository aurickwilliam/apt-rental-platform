import { useState, useRef, useEffect, useCallback } from 'react';
import * as VideoThumbnails from 'expo-video-thumbnails';

import {
  getCurrentUserProfile,
  fetchMessages,
  fetchOtherUserProfile,
  insertMessage,
  insertAttachmentMessage,
  uploadChatAttachment,
  uploadChatThumbnail,
  getChatAttachmentSignedUrl,
  markMessagesAsRead,
  buildConversationKey,
  resolveMessageType,
  type Message,
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

  const {
    onTextChange: onTypingTextChange,
    stop: stopTyping,
    cleanup: cleanupTyping,
  } = useChatTyping({
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
      messageType: 'text',
      attachmentUrl: null,
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

  /** Uploads a picked image/video/gif and sends it as its own attachment-only message. */
  const handleSendAttachment = useCallback(
    async (localUri: string, mimeType?: string) => {
      stopTyping();

      if (!myId || !otherUserId || sending) return;

      const messageType = resolveMessageType(mimeType);
      const tempId = `temp-${Date.now()}`;

      const pendingMsg: Message = {
        id: tempId,
        message: null,
        messageType,
        attachmentUrl: localUri, // local file:// uri renders fine while the upload is in flight
        attachmentMimeType: mimeType ?? null,
        thumbnailUrl: null,
        timestamp: 'Sending...',
        isSent: true,
        isPending: true,
      };

      setMessages((prev) => [pendingMsg, ...prev]);
      setSending(true);

      try {
        const path = await uploadChatAttachment(myId, localUri, mimeType);
        const signedUrl = await getChatAttachmentSignedUrl(path);

        let thumbnailPath: string | null = null;
        let thumbnailUrl: string | null = null;

        if (messageType === 'video') {
          try {
            const { uri: thumbLocalUri } = await VideoThumbnails.getThumbnailAsync(localUri, {
              time: 0,
            });
            thumbnailPath = await uploadChatThumbnail(myId, thumbLocalUri);
            thumbnailUrl = await getChatAttachmentSignedUrl(thumbnailPath);
          } catch (thumbErr) {
            // Non-fatal — the video still sends, just without a poster frame.
            console.warn('Video thumbnail generation failed:', thumbErr);
          }
        }

        const inserted = await insertAttachmentMessage({
          senderId: myId,
          receiverId: otherUserId,
          apartmentId,
          messageType,
          attachmentPath: path,
          attachmentMimeType: mimeType,
          attachmentThumbnailPath: thumbnailPath,
        });

        const sentMsg: Message = {
          id: inserted.id,
          message: null,
          messageType,
          attachmentUrl: signedUrl,
          attachmentMimeType: mimeType ?? null,
          thumbnailUrl,
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
          message: null,
          messageType,
          attachmentUrl: signedUrl,
          attachmentMimeType: mimeType ?? null,
          thumbnailUrl,
          created_at: inserted.created_at,
          sender_id: myId,
          apartment_id: apartmentId,
        });
      } catch (err) {
        console.error('Attachment send failed:', err);
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
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
    handleSendAttachment,
    handleInputBlur,
  };
}
