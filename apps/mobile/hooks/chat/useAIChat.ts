import { useCallback, useEffect, useRef, useState } from "react";

import {
  AVA_STRINGS,
  answerAva,
  avaChatTitle,
  avaConversationLanguage,
  removeAvaChat,
  upsertAvaChat,
  type AvaPreferences,
  type AvaSavedChat,
  type AvaSavedMessage,
  type AvaSearchState,
  type AvaTurn,
} from "@repo/utils";

import { type ApartmentCardProps } from "@/components/cards/ApartmentCard";
import { loadAvaChats, saveAvaChats } from "@/service/chat/avaHistoryStore";
import { askAva, fetchAvaListings, fetchAvaListingsByIds } from "@/service/search/aiSearchService";

export type AIChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: number;
  quickReplies?: string[];
  /** Real listings found with the filters Ava understood. */
  listings?: ApartmentCardProps[];
  /** Why each listing is recommended (distance, budget fit, amenities), by listing id. */
  notes?: Record<string, string>;
  /** The search this reply ran, remembered so follow-ups build on it. */
  search?: AvaSearchState;
  shownIds?: string[];
};

let messageSequence = 0;
const nextMessageId = () => `${Date.now()}-${(messageSequence += 1)}`;
const nextChatId = () => `ava-chat-${Date.now()}-${(messageSequence += 1)}`;

const toSavedMessage = (message: AIChatMessage): AvaSavedMessage => ({
  id: message.id,
  role: message.role,
  text: message.text,
  quickReplies: message.quickReplies,
  notes: message.notes,
  search: message.search,
  shownIds: message.shownIds,
  listingIds: message.listings?.map((listing) => listing.id),
});

// A saved message without its listings, which are re-read when the chat opens.
const fromSavedMessage = (message: AvaSavedMessage): AIChatMessage => ({
  id: message.id,
  role: message.role,
  text: message.text,
  timestamp: Date.now(),
  quickReplies: message.quickReplies,
  notes: message.notes,
  search: message.search,
  shownIds: message.shownIds,
});

const toTurns = (messages: AIChatMessage[]): AvaTurn[] =>
  messages.map((message) => ({
    role: message.role,
    text: message.text,
    search: message.search,
    shownIds: message.shownIds,
  }));

/**
 * Ava's chat. `preferences` are the saved rental preferences (kept on the device,
 * never sent to the model). With an `authUserId` each conversation is also saved on the
 * device (history list); without one the chat is memory-only. Listings are
 * saved as ids and re-read when a chat is opened.
 */
export function useAIChat(authUserId?: string | null, preferences?: AvaPreferences | null) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chats, setChats] = useState<AvaSavedChat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const chatsRef = useRef<AvaSavedChat[]>([]);
  // Bumped by resetChat/openChat so a reply still in flight never lands in another chat.
  const chatGenerationRef = useRef(0);

  // Saving waits for the stored history to be read: a reply can land first, and
  // writing just the new chat would overwrite the older ones.
  const historyReadyRef = useRef<Promise<void> | null>(null);
  const historyLoadedRef = useRef(false);

  useEffect(() => {
    let active = true;
    if (!authUserId) return;
    historyLoadedRef.current = false;
    const ready = loadAvaChats(authUserId).then((stored) => {
      if (!active) return;
      // A chat saved before storage answered stays on top.
      const merged = chatsRef.current.reduce((list, chat) => upsertAvaChat(list, chat), stored);
      chatsRef.current = merged;
      historyLoadedRef.current = true;
      setChats(merged);
    });
    historyReadyRef.current = ready;
    return () => {
      active = false;
      chatsRef.current = [];
      historyReadyRef.current = null;
    };
  }, [authUserId]);

  const persist = useCallback(
    (chatId: string, chatMessages: AIChatMessage[]) => {
      if (!authUserId || chatMessages.length === 0) return;
      const saved: AvaSavedChat = {
        id: chatId,
        title: avaChatTitle(chatMessages),
        updatedAt: Date.now(),
        messages: chatMessages.map(toSavedMessage),
      };
      const write = () => {
        const next = upsertAvaChat(chatsRef.current, saved);
        chatsRef.current = next;
        setChats(next);
        void saveAvaChats(authUserId, next);
      };
      if (historyLoadedRef.current || !historyReadyRef.current) write();
      else void historyReadyRef.current.then(write);
    },
    [authUserId],
  );

  const sendMessage = useCallback(
    async (text?: string) => {
      const trimmed = (text ?? input).trim();
      if (!trimmed || isLoading) return;

      const chatId = activeChatId ?? nextChatId();
      if (!activeChatId) setActiveChatId(chatId);

      const userMessage: AIChatMessage = {
        id: nextMessageId(),
        role: "user",
        text: trimmed,
        timestamp: Date.now(),
      };
      const base = [...messages, userMessage];

      setMessages(base);
      setInput("");
      setIsLoading(true);

      const generation = chatGenerationRef.current;
      const isCurrentChat = () => generation === chatGenerationRef.current;

      const reply = (
        replyText: string,
        extra: Pick<AIChatMessage, "quickReplies" | "listings" | "notes" | "search" | "shownIds"> = {},
      ) => {
        if (!isCurrentChat()) return;
        const assistant: AIChatMessage = {
          id: nextMessageId(),
          role: "assistant",
          text: replyText,
          timestamp: Date.now(),
          ...extra,
        };
        setMessages([...base, assistant]);
        persist(chatId, [...base, assistant]);
      };

      const turns = toTurns(base);
      let language = avaConversationLanguage(turns);
      try {
        const answer = await askAva(turns);

        let outcome: Awaited<ReturnType<typeof answerAva<ApartmentCardProps>>>;
        try {
          outcome = await answerAva<ApartmentCardProps>(answer, turns, (request) =>
            fetchAvaListings(request.filters, request.limit, request.excludeIds, {
              light: request.light,
              ids: request.ids,
            }),
            undefined,
            { preferences },
          );
        } catch (err) {
          console.error("Ava listings failed:", err);
          reply(AVA_STRINGS[language].listingsError);
          return;
        }

        language = outcome.language;
        reply(outcome.reply.text, {
          quickReplies: outcome.reply.quickReplies,
          listings: outcome.listings,
          notes: outcome.notes,
          search: outcome.state ?? undefined,
          shownIds: outcome.shownIds,
        });
      } catch (err) {
        console.error("Ava chat failed:", err);
        reply(AVA_STRINGS[language].genericError);
      } finally {
        if (isCurrentChat()) setIsLoading(false);
      }
    },
    [activeChatId, input, isLoading, messages, persist, preferences],
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
      const found = await fetchAvaListingsByIds(ids);
      if (generation !== chatGenerationRef.current) return;
      setMessages(
        saved.messages.map((message) => ({
          ...fromSavedMessage(message),
          listings: (message.listingIds ?? [])
            .map((id) => found.get(id))
            .filter((listing): listing is ApartmentCardProps => listing !== undefined),
        })),
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
      if (authUserId) void saveAvaChats(authUserId, next);
      if (chatId === activeChatId) resetChat();
    },
    [activeChatId, authUserId, resetChat],
  );

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
