"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { createClient } from "@repo/supabase/browser";
import {
  AVA_STRINGS,
  aiFiltersToBrowseParams,
  answerAva,
  avaChatTitle,
  avaConversationLanguage,
  avaFallbackAnswer,
  buildAvaRequest,
  hasAvaQuestion,
  isBrowseExpressible,
  readAvaResponse,
  removeAvaChat,
  upsertAvaChat,
  type AvaAnswer,
  type AvaSavedChat,
  type AvaSavedMessage,
  type AvaSearchState,
  type AvaTurn,
} from "@repo/utils";

import type { BrowseApartment } from "@/app/browse/lib/browse-apartment";
import { fetchAvaListingsByIds, fetchAvaResults } from "@/app/browse/lib/fetch-ava-results";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { useUser } from "@/hooks/use-user";
import { loadAvaChats, saveAvaChats } from "@/lib/ava-history";

export interface AvaChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  quickReplies?: string[];
  /** Real listings found with the filters Ava understood. */
  listings?: BrowseApartment[];
  /** The Browse query for those listings, for "See all results" (not set for distance searches). */
  browseParams?: Record<string, string>;
  /** Why each listing is recommended (distance, budget fit, amenities), by listing id. */
  notes?: Record<string, string>;
  /** The search this reply ran, remembered so follow-ups build on it. */
  search?: AvaSearchState;
  shownIds?: string[];
}

let messageSequence = 0;
const nextMessageId = () => `ava-${Date.now()}-${(messageSequence += 1)}`;
const nextChatId = () => `ava-chat-${Date.now()}-${(messageSequence += 1)}`;

const toTurns = (messages: AvaChatMessage[]): AvaTurn[] =>
  messages.map((message) => ({
    role: message.role,
    text: message.text,
    search: message.search,
    shownIds: message.shownIds,
  }));

const toSavedMessage = (message: AvaChatMessage): AvaSavedMessage => ({
  id: message.id,
  role: message.role,
  text: message.text,
  quickReplies: message.quickReplies,
  notes: message.notes,
  search: message.search,
  shownIds: message.shownIds,
  listingIds: message.listings?.map((listing) => listing.id),
});

// The messages of a saved chat; listings are filled in by `hydrateListings`.
const fromSavedMessage = (message: AvaSavedMessage): AvaChatMessage => ({
  id: message.id,
  role: message.role,
  text: message.text,
  quickReplies: message.quickReplies,
  notes: message.notes,
  search: message.search,
  shownIds: message.shownIds,
});

// The language to use for an error before the answer is read.
const detectedLanguage = (messages: AvaChatMessage[], latest: string) =>
  avaConversationLanguage([...toTurns(messages), { role: "user", text: latest }]);

async function askAva(
  supabase: ReturnType<typeof createClient>,
  turns: AvaTurn[],
): Promise<AvaAnswer> {
  if (!hasAvaQuestion(turns)) return avaFallbackAnswer(turns);

  const { data, error } = await supabase.functions.invoke("ai-search", {
    body: buildAvaRequest(turns),
  });
  if (error || !data) {
    console.error("Ava request failed:", error?.message ?? "empty response");
    return avaFallbackAnswer(turns);
  }
  return readAvaResponse(data, turns);
}

interface UseAvaChatOptions {
  /** A saved chat to open once the history has loaded (the full-page view's `?chat=`). */
  initialChatId?: string | null;
}

// Ava, the APT Virtual Assistant (web). Each reply remembers the search it ran,
// so follow-ups ("show me more", "what if my budget is 8k?") build on it. Reading
// Gemini's answer, language, landmarks, distance ranking and what Ava says come
// from `@repo/utils` (`answerAva`), shared with mobile. Conversations are saved
// in this browser per account (`lib/ava-history.ts`); listings are saved as ids
// and re-read when a chat is opened.
export function useAvaChat({ initialChatId = null }: UseAvaChatOptions = {}) {
  const { user } = useUser();
  const authUserId = user?.id;

  const loadChats = useCallback(async () => loadAvaChats(authUserId), [authUserId]);
  const {
    data: chats,
    loading: historyLoading,
    setData: setChats,
  } = useAsyncResource<AvaSavedChat[]>(loadChats, [], "Unable to load your chat history.");
  const chatsRef = useRef<AvaSavedChat[]>([]);
  useEffect(() => {
    chatsRef.current = chats;
  }, [chats]);

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<AvaChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  // Bumped by resetChat/openChat so a reply still in flight never lands in another chat.
  const chatGenerationRef = useRef(0);

  const persist = useCallback(
    (chatId: string, chatMessages: AvaChatMessage[]) => {
      if (!authUserId || chatMessages.length === 0) return;
      const saved: AvaSavedChat = {
        id: chatId,
        title: avaChatTitle(chatMessages),
        updatedAt: Date.now(),
        messages: chatMessages.map(toSavedMessage),
      };
      const next = upsertAvaChat(chatsRef.current, saved);
      chatsRef.current = next;
      setChats(next);
      saveAvaChats(authUserId, next);
    },
    [authUserId, setChats],
  );

  const sendMessage = useCallback(
    async (text?: string) => {
      const trimmed = (text ?? input).trim();
      if (!trimmed || isLoading) return;

      const chatId = activeChatId ?? nextChatId();
      if (!activeChatId) setActiveChatId(chatId);

      const userMessage: AvaChatMessage = { id: nextMessageId(), role: "user", text: trimmed };
      const base = [...messages, userMessage];
      setMessages(base);
      setInput("");
      setIsLoading(true);

      const generation = chatGenerationRef.current;
      const isCurrentChat = () => generation === chatGenerationRef.current;
      const reply = (message: Omit<AvaChatMessage, "id" | "role">) => {
        if (!isCurrentChat()) return;
        const assistant: AvaChatMessage = { id: nextMessageId(), role: "assistant", ...message };
        setMessages([...base, assistant]);
        persist(chatId, [...base, assistant]);
      };

      let language = detectedLanguage(messages, trimmed);
      try {
        const supabase = createClient();
        const turns = toTurns(base);
        const answer = await askAva(supabase, turns);

        let outcome: Awaited<ReturnType<typeof answerAva<BrowseApartment>>>;
        try {
          outcome = await answerAva<BrowseApartment>(answer, turns, (request) =>
            fetchAvaResults(
              supabase,
              aiFiltersToBrowseParams(request.filters),
              request.limit,
              request.excludeIds,
            ),
          );
        } catch (err) {
          console.error("Ava listings failed:", err);
          reply({ text: AVA_STRINGS[language].listingsError });
          return;
        }

        language = outcome.language;
        const isDistanceSearch = outcome.state?.landmarkKey != null;
        reply({
          ...outcome.reply,
          listings: outcome.listings,
          notes: outcome.notes,
          search: outcome.state ?? undefined,
          shownIds: outcome.shownIds,
          // "See all results" opens plain Browse, which cannot rank by distance.
          browseParams:
            outcome.filters &&
            !isDistanceSearch &&
            isBrowseExpressible(outcome.filters) &&
            outcome.listings.length > 0
              ? aiFiltersToBrowseParams(outcome.filters)
              : undefined,
        });
      } catch (err) {
        console.error("Ava chat failed:", err);
        reply({ text: AVA_STRINGS[language].genericError });
      } finally {
        if (isCurrentChat()) setIsLoading(false);
      }
    },
    [activeChatId, input, isLoading, messages, persist],
  );

  /** Starts an empty chat. The current one stays in the history. */
  const resetChat = useCallback(() => {
    chatGenerationRef.current += 1;
    setActiveChatId(null);
    setMessages([]);
    setInput("");
    setIsLoading(false);
  }, []);

  /** Opens a saved chat; its listings are re-read so none is stale or no longer visible. */
  const openChat = useCallback(async (chatId: string) => {
    const saved = chatsRef.current.find((chat) => chat.id === chatId);
    if (!saved) return;

    chatGenerationRef.current += 1;
    const generation = chatGenerationRef.current;
    setActiveChatId(chatId);
    setInput("");
    setIsLoading(false);
    setMessages(saved.messages.map(fromSavedMessage));

    const ids = [...new Set(saved.messages.flatMap((message) => message.listingIds ?? []))];
    if (ids.length === 0) return;
    try {
      const found = await fetchAvaListingsByIds(createClient(), ids);
      if (generation !== chatGenerationRef.current) return;
      setMessages(
        saved.messages.map((message) => {
          const listings = (message.listingIds ?? [])
            .map((id) => found.get(id))
            .filter((listing): listing is BrowseApartment => listing !== undefined);
          const isDistanceSearch = message.search?.landmarkKey != null;
          return {
            ...fromSavedMessage(message),
            listings,
            browseParams:
              message.search &&
              !isDistanceSearch &&
              isBrowseExpressible(message.search.filters) &&
              listings.length > 0
                ? aiFiltersToBrowseParams(message.search.filters)
                : undefined,
          };
        }),
      );
    } catch (err) {
      console.error("Ava history listings failed:", err);
    }
  }, []);

  const deleteChat = useCallback(
    (chatId: string) => {
      const next = removeAvaChat(chatsRef.current, chatId);
      chatsRef.current = next;
      setChats(next);
      saveAvaChats(authUserId, next);
      if (chatId === activeChatId) resetChat();
    },
    [activeChatId, authUserId, resetChat, setChats],
  );

  // The full-page view opens the chat named in its URL once the history is in.
  const openedInitialRef = useRef<string | null>(null);
  useEffect(() => {
    if (!initialChatId || historyLoading || openedInitialRef.current === initialChatId) return;
    openedInitialRef.current = initialChatId;
    void Promise.resolve().then(() => openChat(initialChatId));
  }, [historyLoading, initialChatId, openChat]);

  return {
    input,
    setInput,
    messages,
    isLoading,
    sendMessage,
    resetChat,
    chats,
    activeChatId,
    openChat,
    deleteChat,
  };
}

export type AvaChatState = ReturnType<typeof useAvaChat>;
