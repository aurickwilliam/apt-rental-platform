"use client";

import { useCallback, useState } from "react";

import { useAsyncResource } from "@/hooks/use-async-resource";
import { useUser } from "@/hooks/use-user";
import {
  addRecentMessageSearch,
  loadRecentMessageSearches,
  saveRecentMessageSearches,
} from "@/lib/conversation-search";

/**
 * The Messages search box: the text being typed plus this account's recent
 * search terms (device-only, see `lib/conversation-search.ts`). Terms are
 * recorded when a search is submitted or a result is opened, never per keystroke.
 */
export function useConversationSearch() {
  const { user, loading } = useUser();
  const authUserId = user?.id;
  const [query, setQuery] = useState("");

  const load = useCallback(
    async () => (loading ? [] : loadRecentMessageSearches(authUserId)),
    [loading, authUserId],
  );
  const { data: recent, setData } = useAsyncResource<string[]>(load, [], "Unable to load recent searches");

  const remember = useCallback(
    (term: string) => {
      if (loading || !term.trim()) return;
      const next = addRecentMessageSearch(recent, term);
      saveRecentMessageSearches(authUserId, next);
      setData(next);
    },
    [authUserId, loading, recent, setData],
  );

  const clearRecent = useCallback(() => {
    saveRecentMessageSearches(authUserId, []);
    setData([]);
  }, [authUserId, setData]);

  return { query, setQuery, recent, remember, clearRecent };
}
