import { useCallback, useRef, useState } from "react";

import { CAMANAVA_CITIES } from "@repo/constants";

import { type ApartmentCardProps } from "@/components/cards/ApartmentCard";
import {
  askAva,
  fetchAvaListings,
  hasSearchableDetails,
  type AvaTurn,
} from "@/service/search/aiSearchService";

export type AIChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: number;
  quickReplies?: string[];
  /** Real listings found with the filters Ava understood. */
  listings?: ApartmentCardProps[];
};

const CITY_QUICK_REPLIES = [...CAMANAVA_CITIES];
const ASK_FOR_DETAILS =
  "I'd love to help! Tell me the area, your monthly budget, or how many bedrooms you need.";
const FOUND_REPLY = "Here are places that match what you told me.";
const NO_RESULTS =
  "I couldn't find a match yet. Try a higher budget, fewer must-haves, or another area.";
const LOOSEN_QUICK_REPLIES = ["Any area in CAMANAVA", "Higher budget", "Any unit type"];
const LIMIT_NOTE = "I've answered a lot today, so I'm using simple search for now.";
const LISTINGS_ERROR = "Sorry, I couldn't load listings right now. Please try again.";
const GENERIC_ERROR = "Sorry, I couldn't process that. Please try again.";

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
        const prefix = answer.source === "limit" ? `${LIMIT_NOTE} ` : "";
        const quickReplies = answer.quickReplies.length > 0 ? answer.quickReplies : undefined;

        if (!hasSearchableDetails(answer.filters)) {
          reply(prefix + (answer.reply ?? ASK_FOR_DETAILS), {
            quickReplies: quickReplies ?? CITY_QUICK_REPLIES,
          });
          return;
        }

        let found: Awaited<ReturnType<typeof fetchAvaListings>>;
        try {
          found = await fetchAvaListings(answer.filters);
        } catch (err) {
          console.error("Ava listings failed:", err);
          reply(LISTINGS_ERROR);
          return;
        }

        if (found.listings.length === 0) {
          // Gemini wrote its main reply before the search; use its no-results
          // reply so the message stays in the tenant's language.
          reply(prefix + (answer.noResultsReply ?? NO_RESULTS), {
            quickReplies:
              answer.noResultsQuickReplies.length > 0
                ? answer.noResultsQuickReplies
                : LOOSEN_QUICK_REPLIES,
            listings: [],
          });
          return;
        }

        reply(prefix + (answer.reply ?? FOUND_REPLY), { quickReplies, listings: found.listings });
      } catch (err) {
        console.error("Ava chat failed:", err);
        reply(GENERIC_ERROR);
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
