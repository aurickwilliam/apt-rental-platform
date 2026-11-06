import { useCallback, useRef, useState } from "react";

import {
  AVA_STRINGS,
  answerAva,
  avaConversationLanguage,
  type AvaSearchState,
  type AvaTurn,
} from "@repo/utils";

import { type ApartmentCardProps } from "@/components/cards/ApartmentCard";
import { askAva, fetchAvaListings } from "@/service/search/aiSearchService";

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

const toTurns = (messages: AIChatMessage[]): AvaTurn[] =>
  messages.map((message) => ({
    role: message.role,
    text: message.text,
    search: message.search,
    shownIds: message.shownIds,
  }));

export function useAIChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // Bumped by resetChat so a reply still in flight never lands in the new chat.
  const chatGenerationRef = useRef(0);

  const sendMessage = useCallback(
    async (text?: string) => {
      const trimmed = (text ?? input).trim();
      if (!trimmed || isLoading) return;

      const userMessage: AIChatMessage = {
        id: nextMessageId(),
        role: "user",
        text: trimmed,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);

      const generation = chatGenerationRef.current;
      const isCurrentChat = () => generation === chatGenerationRef.current;

      const reply = (
        replyText: string,
        extra: Pick<AIChatMessage, "quickReplies" | "listings" | "notes" | "search" | "shownIds"> = {},
      ) => {
        if (!isCurrentChat()) return;
        setMessages((prev) => [
          ...prev,
          {
            id: nextMessageId(),
            role: "assistant",
            text: replyText,
            timestamp: Date.now(),
            ...extra,
          },
        ]);
      };

      const turns = toTurns([...messages, userMessage]);
      let language = avaConversationLanguage(turns);
      try {
        const answer = await askAva(turns);

        let outcome: Awaited<ReturnType<typeof answerAva<ApartmentCardProps>>>;
        try {
          outcome = await answerAva<ApartmentCardProps>(answer, turns, (request) =>
            fetchAvaListings(request.filters, request.limit, request.excludeIds),
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
    [input, isLoading, messages],
  );

  const resetChat = useCallback(() => {
    chatGenerationRef.current += 1;
    setMessages([]);
    setInput("");
    setIsLoading(false);
  }, []);

  return { input, setInput, messages, isLoading, sendMessage, resetChat };
}
