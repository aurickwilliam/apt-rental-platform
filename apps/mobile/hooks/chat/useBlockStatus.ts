import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useCurrentUserId } from "@/hooks/auth";
import { getBlockStatus, unblockUser } from "@/service/chat/conversationActionsService";

import { getUserConversationsQueryPrefix } from "./conversationReadState";
import { getBlockStatusQueryKey } from "./useConversations";

import type { ConversationWithMeta } from "@/service/chat/conversationService";

/**
 * Whether messaging with `otherUserId` is blocked, in either direction. The
 * database refuses new messages either way; this only drives the chat UI.
 */
export function useBlockStatus(otherUserId: string) {
  const queryClient = useQueryClient();
  const myId = useCurrentUserId();
  const [isUnblocking, setIsUnblocking] = useState(false);

  const query = useQuery({
    queryKey: getBlockStatusQueryKey(myId, otherUserId),
    queryFn: () => getBlockStatus(otherUserId),
    enabled: myId !== null && otherUserId.length > 0,
  });

  const unblock = useCallback(async () => {
    if (!myId) return;
    setIsUnblocking(true);
    try {
      await unblockUser(otherUserId);
      queryClient.setQueryData(getBlockStatusQueryKey(myId, otherUserId), {
        blockedByMe: false,
        blockedMe: query.data?.blockedMe ?? false,
      });
      queryClient.setQueriesData<ConversationWithMeta[]>(
        { queryKey: getUserConversationsQueryPrefix(myId) },
        (current) =>
          current?.map((conversation) =>
            conversation.other_user_id === otherUserId
              ? { ...conversation, blocked_by_me: false }
              : conversation
          )
      );
    } finally {
      setIsUnblocking(false);
    }
  }, [myId, otherUserId, query.data?.blockedMe, queryClient]);

  return {
    blockedByMe: query.data?.blockedByMe ?? false,
    blockedMe: query.data?.blockedMe ?? false,
    unblock,
    isUnblocking,
  };
}
