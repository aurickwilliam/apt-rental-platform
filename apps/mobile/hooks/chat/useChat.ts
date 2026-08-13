import { useCallback, useEffect, useRef, useState } from 'react';

import { useCurrentUser } from '@/hooks/auth';

import {
  refreshVisibleChatMediaUrls,
  retryChatMediaUrlOnce,
} from '@/service/privateMediaResolver';

import {
  fetchMessagePage,
  fetchOtherUserProfile,
  insertMessage,
  markMessagesAsRead,
  resolveMessageType,
  sendChatAttachments,
  type ChatMessageCursor,
  type Message,
  type PickedChatAsset,
} from '../../service/chatService';
import { mergeChatMessages } from '../../service/chatPagination';

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
  const currentUserQuery = useCurrentUser();
  const myId = currentUserQuery.data?.id ?? null;
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatMessage, setChatMessage] = useState('');
  const [otherUserName, setOtherUserName] = useState(initialOtherUserName ?? 'User');
  const [otherUserAvatar, setOtherUserAvatar] = useState<string | null>(
    initialOtherUserAvatar ?? null
  );
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<ChatMessageCursor | null>(null);
  const [sending, setSending] = useState(false);
  const [otherUserIsTyping, setOtherUserIsTyping] = useState(false);

  const myIdRef = useRef<string | null>(null);
  const messagesRef = useRef<Message[]>([]);
  const visibleMessageIdsRef = useRef<Set<string>>(new Set());
  const paginationInFlightRef = useRef(false);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // ─── Realtime channel ───────────────────────────────────────────────────────

  const handleNewMessage = useCallback((msg: Message) => {
    setMessages((prev) => mergeChatMessages(prev, [msg], 'newest'));
  }, []);

  const handleOtherUserTypingChange = useCallback((isTyping: boolean) => {
    setOtherUserIsTyping((prev) => (prev === isTyping ? prev : isTyping));
  }, []);

  const { broadcast, trackPresence } = useChatChannel({
    currentUserId: myId,
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

    setMessages((prev) => mergeChatMessages(prev, [pendingMsg], 'newest'));
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
        if (prev.some((message) => message.id === sentMsg.id)) {
          return prev.filter((message) => message.id !== tempId);
        }
        const pendingIndex = prev.findIndex((message) => message.id === tempId);
        if (pendingIndex !== -1) {
          const next = [...prev];
          next[pendingIndex] = sentMsg;
          return next;
        }
        return mergeChatMessages(prev, [sentMsg], 'newest');
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
      setMessages((prev) => prev.filter((message) => message.id !== tempId));
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
      const tempIdByUri = new Map(
        assets.map((asset) => [asset.localUri, `temp-${Date.now()}-${Math.random()}`])
      );

      const pendingMsgs: Message[] = assets.map((asset) => ({
        id: tempIdByUri.get(asset.localUri)!,
        message: null,
        messageType: resolveMessageType(asset.mimeType),
        attachmentUrl: asset.localUri,
        attachmentPath: null,
        attachmentMimeType: asset.mimeType ?? null,
        thumbnailUrl: null,
        groupId,
        timestamp: 'Sending...',
        isSent: true,
        isPending: true,
      }));

      setMessages((prev) => mergeChatMessages(prev, pendingMsgs, 'newest'));
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

          for (const message of sent) {
            const tempId = tempIdByUri.get(message.localUri);
            const index = next.findIndex((entry) => entry.id === tempId);
            if (index !== -1) {
              const copy = [...next];
              copy[index] = message;
              next = copy;
            } else {
              next = mergeChatMessages(next, [message], 'newest');
            }
          }

          const failedTempIds = new Set(
            failed
              .map((failure) => tempIdByUri.get(failure.localUri))
              .filter((id): id is string => Boolean(id))
          );

          return failedTempIds.size > 0
            ? next.filter((message) => !failedTempIds.has(message.id))
            : next;
        });

        for (const message of sent) {
          broadcast({
            id: message.id,
            message: null,
            messageType: message.messageType,
            attachmentUrl: message.attachmentUrl,
            attachmentPath: message.attachmentPath,
            attachmentMimeType: message.attachmentMimeType,
            thumbnailUrl: message.thumbnailUrl,
            thumbnailPath: message.thumbnailPath,
            created_at: new Date().toISOString(),
            sender_id: myId,
            apartment_id: apartmentId,
          });
        }
      } catch (err) {
        console.error('Batch attachment send failed:', err);
        setMessages((prev) =>
          prev.filter((message) => !tempIdByUri.has(message.attachmentUrl ?? ''))
        );
      } finally {
        setSending(false);
      }
    },
    [apartmentId, broadcast, myId, otherUserId, sending, stopTyping]
  );

  const loadOlderMessages = useCallback(async () => {
    if (!myId || !nextCursor || !hasMore || paginationInFlightRef.current) return;

    paginationInFlightRef.current = true;
    setLoadingMore(true);

    try {
      const page = await fetchMessagePage({
        currentUserId: myId,
        otherUserId,
        apartmentId,
        cursor: nextCursor,
      });

      setMessages((prev) => mergeChatMessages(prev, page.messages, 'older'));
      setNextCursor(page.nextCursor);
      setHasMore(page.nextCursor !== null);
    } catch (err) {
      console.error('Load older chat messages failed:', err);
    } finally {
      paginationInFlightRef.current = false;
      setLoadingMore(false);
    }
  }, [apartmentId, hasMore, myId, nextCursor, otherUserId]);

  const refreshVisibleMedia = useCallback(async () => {
    const visibleIds = visibleMessageIdsRef.current;
    if (visibleIds.size === 0) return;

    const visibleMessages = messagesRef.current.filter((message) => visibleIds.has(message.id));
    const attachmentPaths = visibleMessages
      .map((message) => message.attachmentPath)
      .filter((path): path is string => Boolean(path));
    const thumbnailPaths = visibleMessages
      .map((message) => message.thumbnailPath)
      .filter((path): path is string => Boolean(path));

    if (attachmentPaths.length === 0 && thumbnailPaths.length === 0) return;

    const [attachmentResolution, thumbnailResolution] = await Promise.all([
      refreshVisibleChatMediaUrls(attachmentPaths),
      refreshVisibleChatMediaUrls(thumbnailPaths),
    ]);

    setMessages((current) =>
      current.map((message) => {
        if (!visibleIds.has(message.id)) return message;

        const attachmentUrl = message.attachmentPath
          ? (attachmentResolution.urls[message.attachmentPath] ?? message.attachmentUrl)
          : message.attachmentUrl;
        const thumbnailUrl = message.thumbnailPath
          ? (thumbnailResolution.urls[message.thumbnailPath] ?? message.thumbnailUrl)
          : message.thumbnailUrl;

        return attachmentUrl === message.attachmentUrl && thumbnailUrl === message.thumbnailUrl
          ? message
          : { ...message, attachmentUrl, thumbnailUrl };
      })
    );
  }, []);

  const handleVisibleMessages = useCallback(
    (messageIds: string[]) => {
      visibleMessageIdsRef.current = new Set(messageIds);
      void refreshVisibleMedia();
    },
    [refreshVisibleMedia]
  );

  const retryChatMediaOnce = useCallback(
    async (messageId: string, mediaKind: 'attachment' | 'thumbnail') => {
      const message = messagesRef.current.find((entry) => entry.id === messageId);
      const path = mediaKind === 'attachment' ? message?.attachmentPath : message?.thumbnailPath;
      if (!path) return;

      const { didRetry, urls } = await retryChatMediaUrlOnce(messageId, mediaKind, path);
      if (!didRetry) return;

      const refreshedUrl = urls[path] ?? null;
      setMessages((current) =>
        current.map((entry) => {
          if (entry.id !== messageId) return entry;
          return mediaKind === 'attachment'
            ? { ...entry, attachmentUrl: refreshedUrl }
            : { ...entry, thumbnailUrl: refreshedUrl };
        })
      );
    },
    []
  );

  useEffect(() => {
    const refreshInterval = setInterval(() => {
      void refreshVisibleMedia();
    }, 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [refreshVisibleMedia]);

  // ─── Init ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    paginationInFlightRef.current = false;
    setLoading(true);
    setLoadingMore(false);
    setHasMore(false);
    setNextCursor(null);
    setMessages([]);

    async function init() {
      if (!myId) {
        if (!cancelled && !currentUserQuery.isLoading) setLoading(false);
        return;
      }

      try {
        myIdRef.current = myId;

        const [otherProfile, page] = await Promise.all([
          fetchOtherUserProfile(otherUserId),
          fetchMessagePage({
            currentUserId: myId,
            otherUserId,
            apartmentId,
          }),
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

        setMessages((current) => mergeChatMessages(current, page.messages, 'older'));
        setNextCursor(page.nextCursor);
        setHasMore(page.nextCursor !== null);
        markMessagesAsRead(myId, otherUserId, apartmentId).catch(console.error);
      } catch (err) {
        console.error('Chat init error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void init();

    return () => {
      cancelled = true;
      myIdRef.current = null;
      paginationInFlightRef.current = false;
      stopTyping();
      cleanupTyping();
    };
  }, [
    apartmentId,
    cleanupTyping,
    currentUserQuery.isLoading,
    initialOtherUserAvatar,
    initialOtherUserName,
    myId,
    otherUserId,
    stopTyping,
  ]);

  return {
    myId,
    messages,
    chatMessage,
    otherUserName,
    otherUserAvatar,
    loading,
    loadingMore,
    hasMore,
    sending,
    otherUserIsTyping,
    handleChatMessageChange,
    handleSend,
    handleInputBlur,
    handleSendImages,
    handleVisibleMessages,
    retryChatMediaOnce,
    loadOlderMessages,
  };
}
