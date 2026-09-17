import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { useCurrentUser } from '@/hooks/auth';

import {
  refreshVisibleChatMediaUrls,
  retryChatMediaUrlOnce,
} from '@/service/media/privateMediaResolver';

import {
  deleteChatMessage,
  deleteChatReaction,
  fetchMessagePage,
  fetchOtherUserProfile,
  insertMessage,
  markMessagesAsRead,
  resolveMessageType,
  sendChatAttachments,
  upsertChatReaction,
  type ChatMessageCursor,
  type Message,
  type MessageReaction,
  type PickedChatAsset,
  type ReplyPreview,
} from '../../service/chat/chatService';
import { mergeChatMessages } from '../../service/chat/chatPagination';

import { useChatChannel, type ReactionBroadcast } from './useChatChannel';
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
  const [replyTarget, setReplyTarget] = useState<Message | null>(null);

  const myIdRef = useRef<string | null>(null);
  const messagesRef = useRef<Message[]>([]);
  const visibleMessageIdsRef = useRef<Set<string>>(new Set());
  const paginationInFlightRef = useRef(false);

  // Identity props are read through refs so the init effect only re-runs when
  // the conversation itself changes (M12).
  const initialOtherUserNameRef = useRef(initialOtherUserName);
  const initialOtherUserAvatarRef = useRef(initialOtherUserAvatar);

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

  const handleMessageDeleted = useCallback((id: string) => {
    setMessages((prev) =>
      prev
        .filter((m) => m.id !== id)
        .map((m) => (m.replyTo?.id === id ? { ...m, replyTo: null, replyDeleted: true } : m))
    );
  }, []);

  const handleReactionChange = useCallback((reaction: ReactionBroadcast) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== reaction.messageId) return m;
        const others = m.reactions.filter((r) => r.userId !== reaction.sender_id);
        if (reaction.emoji === null) return { ...m, reactions: others };
        return {
          ...m,
          reactions: [
            ...others,
            { emoji: reaction.emoji, userId: reaction.sender_id, isMine: false },
          ],
        };
      })
    );
  }, []);

  const { broadcast, broadcastDelete, broadcastReaction, trackPresence } = useChatChannel({
    currentUserId: myId,
    otherUserId,
    apartmentId,
    onNewMessage: handleNewMessage,
    onOtherUserTypingChange: handleOtherUserTypingChange,
    onMessageDeleted: handleMessageDeleted,
    onReactionChange: handleReactionChange,
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

  // Teardown callbacks are mirrored to refs so the init effect cleanup always
  // calls the latest identity without re-running the effect (M12).
  const stopTypingRef = useRef(stopTyping);
  const cleanupTypingRef = useRef(cleanupTyping);

  useEffect(() => {
    stopTypingRef.current = stopTyping;
    cleanupTypingRef.current = cleanupTyping;
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

  const handleReply = useCallback((msg: Message) => {
    if (msg.isPending) return;
    setReplyTarget(msg);
  }, []);

  const clearReply = useCallback(() => setReplyTarget(null), []);

  const toReplyPreview = useCallback(
    (msg: Message | null): ReplyPreview | null => {
      if (!msg || msg.isPending || msg.id.startsWith('temp-')) return null;
      return {
        id: msg.id,
        message: msg.message,
        messageType: msg.messageType,
        senderId: msg.isSent ? (myId ?? '') : otherUserId,
        isSent: msg.isSent,
      };
    },
    [myId, otherUserId]
  );

  const handleSend = useCallback(async () => {
    stopTyping();

    if (!chatMessage.trim() || !myId || !otherUserId || sending) return;

    const text = chatMessage.trim();
    const tempId = `temp-${Date.now()}`;
    const currentReply = replyTarget;
    const replyPreview = toReplyPreview(currentReply);

    const pendingMsg: Message = {
      id: tempId,
      message: text,
      messageType: 'text',
      attachmentUrl: null,
      attachmentPath: null,
      timestamp: 'Sending...',
      createdAt: new Date().toISOString(),
      isSent: true,
      isPending: true,
      replyTo: replyPreview,
      reactions: [],
    };

    setMessages((prev) => mergeChatMessages(prev, [pendingMsg], 'newest'));
    setChatMessage('');
    if (currentReply) setReplyTarget(null);
    setSending(true);

    try {
      const inserted = await insertMessage({
        senderId: myId,
        receiverId: otherUserId,
        message: text,
        apartmentId,
        replyToId: currentReply?.id ?? null,
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
        createdAt: inserted.created_at,
        isSent: true,
        replyTo: replyPreview,
        reactions: [],
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
        reply_to: currentReply?.id ?? null,
        reply_message: currentReply?.message ?? null,
        reply_message_type: (currentReply?.messageType as any) ?? null,
        reply_sender_id: currentReply ? (currentReply.isSent ? myId : otherUserId) : null,
      });
    } catch (err) {
      console.error('Send failed:', err);
      setMessages((prev) => prev.filter((message) => message.id !== tempId));
      setChatMessage(text);
      if (currentReply) setReplyTarget(currentReply);
    } finally {
      setSending(false);
    }
  }, [apartmentId, broadcast, chatMessage, myId, otherUserId, sending, stopTyping, replyTarget, toReplyPreview]);

  const handleSendImages = useCallback(
    async (assets: PickedChatAsset[]) => {
      stopTyping();
      if (!myId || !otherUserId || sending || assets.length === 0) return;

      const groupId = assets.length > 1 ? `pending-${Date.now()}` : null;
      const tempIdByUri = new Map(
        assets.map((asset) => [asset.localUri, `temp-${Date.now()}-${Math.random()}`])
      );
      const currentReply = replyTarget;
      const replyPreview = toReplyPreview(currentReply);

      const pendingMsgs: Message[] = assets.map((asset, idx) => ({
        id: tempIdByUri.get(asset.localUri)!,
        message: null,
        messageType: resolveMessageType(asset.mimeType),
        attachmentUrl: asset.localUri,
        attachmentPath: null,
        attachmentMimeType: asset.mimeType ?? null,
        thumbnailUrl: null,
        groupId,
        timestamp: 'Sending...',
        createdAt: new Date().toISOString(),
        isSent: true,
        isPending: true,
        replyTo: idx === 0 ? replyPreview : null,
        reactions: [],
      }));

      setMessages((prev) => mergeChatMessages(prev, pendingMsgs, 'newest'));
      if (currentReply) setReplyTarget(null);
      setSending(true);

      try {
        const { sent, failed } = await sendChatAttachments({
          senderId: myId,
          receiverId: otherUserId,
          apartmentId,
          assets,
          replyToId: currentReply?.id ?? null,
        });

        // Attach quoted snapshot to first sent (optimistic)
        if (replyPreview && sent.length > 0) {
          sent[0] = { ...sent[0], replyTo: replyPreview } as typeof sent[0];
        }

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

        for (let idx = 0; idx < sent.length; idx++) {
          const message = sent[idx];
          const isFirst = idx === 0;
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
            reply_to: isFirst ? (currentReply?.id ?? null) : null,
            reply_message: isFirst ? (currentReply?.message ?? null) : null,
            reply_message_type: isFirst ? ((currentReply?.messageType as any) ?? null) : null,
            reply_sender_id: isFirst ? (currentReply ? (currentReply.isSent ? myId : otherUserId) : null) : null,
          });
        }
      } catch (err) {
        console.error('Batch attachment send failed:', err);
        setMessages((prev) =>
          prev.filter((message) => !tempIdByUri.has(message.attachmentUrl ?? ''))
        );
        if (currentReply) setReplyTarget(currentReply);
      } finally {
        setSending(false);
      }
    },
    [apartmentId, broadcast, myId, otherUserId, sending, stopTyping, replyTarget, toReplyPreview]
  );

  const handleUnsend = useCallback(
    async (messageId: string) => {
      if (!myId) return;
      const target = messagesRef.current.find((m) => m.id === messageId);
      if (!target || !target.isSent || target.isPending) return;

      Alert.alert('Unsend message?', 'This will remove it for everyone.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unsend',
          style: 'destructive',
          onPress: async () => {
            const snapshot = target;
            setMessages((prev) =>
              prev
                .filter((m) => m.id !== messageId)
                .map((m) => (m.replyTo?.id === messageId ? { ...m, replyTo: null, replyDeleted: true } : m))
            );
            try {
              await deleteChatMessage({
                messageId,
                senderId: myId,
                attachmentPath: snapshot.attachmentPath ?? null,
                thumbnailPath: snapshot.thumbnailPath ?? null,
              });
              broadcastDelete({ id: messageId, apartment_id: apartmentId });
            } catch (err) {
              console.error('Unsend failed:', err);
              Alert.alert('Unsend failed', err instanceof Error ? err.message : 'Please try again.');
              setMessages((prev) => mergeChatMessages(prev, [snapshot], 'newest'));
            }
          },
        },
      ]);
    },
    [myId, apartmentId, broadcastDelete]
  );

  /**
   * One reaction per user per message: tapping your active emoji removes it,
   * picking another replaces it. Optimistic with rollback + realtime broadcast.
   */
  const handleToggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!myId) return;
      const target = messagesRef.current.find((m) => m.id === messageId);
      if (!target || target.isPending || messageId.startsWith('temp-')) return;

      const myCurrent = target.reactions.find((r) => r.isMine);
      const removing = myCurrent?.emoji === emoji;
      const nextReaction: MessageReaction | null = removing
        ? null
        : { emoji, userId: myId, isMine: true };

      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          const others = m.reactions.filter((r) => !r.isMine);
          return { ...m, reactions: nextReaction ? [...others, nextReaction] : others };
        })
      );

      try {
        if (removing) {
          await deleteChatReaction({ messageId, userId: myId });
        } else {
          await upsertChatReaction({ messageId, userId: myId, emoji });
        }
        broadcastReaction({
          messageId,
          emoji: nextReaction?.emoji ?? null,
          sender_id: myId,
          apartment_id: apartmentId,
        });
      } catch (err) {
        console.error('Reaction failed:', err);
        const snapshot = target.reactions;
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, reactions: snapshot } : m))
        );
      }
    },
    [apartmentId, broadcastReaction, myId]
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

  // Signed-out loading state is ended separately so the init effect below can
  // depend only on the conversation identity (M12).
  useEffect(() => {
    if (!myId && !currentUserQuery.isLoading) setLoading(false);
  }, [myId, currentUserQuery.isLoading]);

  useEffect(() => {
    let cancelled = false;
    paginationInFlightRef.current = false;
    setLoading(true);
    setLoadingMore(false);
    setHasMore(false);
    setNextCursor(null);
    setMessages([]);
    setReplyTarget(null);

    async function init() {
      if (!myId) {
        if (!cancelled) setLoading(false);
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
          if (!initialOtherUserNameRef.current) {
            const fullName = `${otherProfile.firstName} ${otherProfile.lastName}`.trim();
            if (fullName) setOtherUserName(fullName);
          }
          if (!initialOtherUserAvatarRef.current && otherProfile.avatarUrl) {
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
      stopTypingRef.current();
      cleanupTypingRef.current();
    };
  }, [apartmentId, myId, otherUserId]);

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
    replyTarget,
    handleChatMessageChange,
    handleSend,
    handleInputBlur,
    handleSendImages,
    handleReply,
    clearReply,
    handleUnsend,
    handleToggleReaction,
    handleVisibleMessages,
    retryChatMediaOnce,
    loadOlderMessages,
  };
}
