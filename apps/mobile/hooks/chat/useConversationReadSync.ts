import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { useIsFocused } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";

import {
  buildConversationKey,
  markMessagesAsRead,
} from "@/service/chat/chatService";

import {
  beginViewingConversation,
  clearCachedUnreadCount,
  getUserConversationsQueryPrefix,
} from "./conversationReadState";

// Groups a burst of incoming messages into one read update.
const INCOMING_READ_DELAY_MS = 500;

interface ConversationReadSyncOptions {
  myId: string | null;
  otherUserId: string;
  apartmentId: string | null;
}

/**
 * Keeps a conversation read while it is on screen (chat focused and the app
 * in the foreground): marks it read on the server when it comes into view and
 * as new messages arrive, and keeps the Messages list badge at zero.
 * Returns the handler to call for each incoming message.
 */
export function useConversationReadSync({
  myId,
  otherUserId,
  apartmentId,
}: ConversationReadSyncOptions) {
  const queryClient = useQueryClient();
  const isFocused = useIsFocused();
  const [isAppActive, setIsAppActive] = useState(AppState.currentState === "active");

  const isViewing = isFocused && isAppActive && myId !== null;
  const isViewingRef = useRef(isViewing);
  const pendingReadRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      setIsAppActive(state === "active");
    });
    return () => subscription.remove();
  }, []);

  const markRead = useCallback(() => {
    if (!myId) return;

    clearCachedUnreadCount(
      queryClient,
      myId,
      buildConversationKey(myId, otherUserId, apartmentId)
    );
    markMessagesAsRead(myId, otherUserId, apartmentId)
      .catch((error: unknown) => {
        console.error("[chat] Failed to mark conversation as read:", error);
      })
      .finally(() => {
        void queryClient.invalidateQueries({
          queryKey: getUserConversationsQueryPrefix(myId),
          refetchType: "none",
        });
      });
  }, [apartmentId, myId, otherUserId, queryClient]);

  const cancelPendingRead = useCallback(() => {
    if (pendingReadRef.current === null) return false;
    clearTimeout(pendingReadRef.current);
    pendingReadRef.current = null;
    return true;
  }, []);

  useEffect(() => {
    isViewingRef.current = isViewing;
    if (!isViewing || !myId) return;

    const endViewing = beginViewingConversation(
      buildConversationKey(myId, otherUserId, apartmentId)
    );
    markRead();

    return () => {
      endViewing();
      // Messages seen just before leaving still count as read.
      if (cancelPendingRead()) markRead();
    };
  }, [apartmentId, cancelPendingRead, isViewing, markRead, myId, otherUserId]);

  const handleIncomingMessage = useCallback(() => {
    if (!isViewingRef.current) return;

    cancelPendingRead();
    pendingReadRef.current = setTimeout(() => {
      pendingReadRef.current = null;
      if (isViewingRef.current) markRead();
    }, INCOMING_READ_DELAY_MS);
  }, [cancelPendingRead, markRead]);

  return { handleIncomingMessage };
}
