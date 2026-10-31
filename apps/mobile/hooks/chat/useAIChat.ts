import { useCallback, useRef, useState } from "react";

import {
  AVA_GENERIC_ERROR,
  AVA_LISTINGS_ERROR,
  composeAvaReply,
  shouldSearchForAva,
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
};

let messageSequence = 0;
const nextMessageId = () => `${Date.now()}-${(messageSequence += 1)}`;

const toTurns = (messages: AIChatMessage[]): AvaTurn[] =>
  messages.map((message) => ({ role: message.role, text: message.text }));

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
        extra: Pick<AIChatMessage, "quickReplies" | "listings"> = {},
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

      try {
        const answer = await askAva(toTurns([...messages, userMessage]));

        if (!shouldSearchForAva(answer)) {
          const { text: replyText, quickReplies } = composeAvaReply(answer, null);
          reply(replyText, { quickReplies });
          return;
        }

        let found: Awaited<ReturnType<typeof fetchAvaListings>>;
        try {
          found = await fetchAvaListings(answer.filters);
        } catch (err) {
          console.error("Ava listings failed:", err);
          reply(AVA_LISTINGS_ERROR);
          return;
        }

        const { text: replyText, quickReplies } = composeAvaReply(answer, found.listings.length);
        reply(replyText, { quickReplies, listings: found.listings });
      } catch (err) {
        console.error("Ava chat failed:", err);
        reply(AVA_GENERIC_ERROR);
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
