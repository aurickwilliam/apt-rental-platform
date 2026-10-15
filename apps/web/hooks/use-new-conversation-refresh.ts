"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// Waits for a burst of first messages to land, so the server counts them all
// in a single re-render.
const NEW_CONVERSATION_REFRESH_DELAY_MS = 300;

/**
 * Re-renders the server-built conversation lists when a message arrives in a
 * conversation the page doesn't list yet (a chat that started while the page
 * was open). Returns `true` when the key was unknown and a refresh is queued.
 */
export function useNewConversationRefresh(conversationKeys: string[]) {
  const router = useRouter();
  const knownKeysRef = useRef<Set<string>>(new Set(conversationKeys));
  const pendingRefreshRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    knownKeysRef.current = new Set(conversationKeys);
  }, [conversationKeys]);

  useEffect(
    () => () => {
      if (pendingRefreshRef.current !== null) clearTimeout(pendingRefreshRef.current);
    },
    []
  );

  return useCallback(
    (conversationKey: string): boolean => {
      if (knownKeysRef.current.has(conversationKey)) return false;

      if (pendingRefreshRef.current !== null) clearTimeout(pendingRefreshRef.current);
      pendingRefreshRef.current = setTimeout(() => {
        pendingRefreshRef.current = null;
        router.refresh();
      }, NEW_CONVERSATION_REFRESH_DELAY_MS);
      return true;
    },
    [router]
  );
}
