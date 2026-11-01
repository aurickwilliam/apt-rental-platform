"use client";

import { useCallback, useRef, useState } from "react";

import { createClient } from "@repo/supabase/browser";
import {
  AVA_GENERIC_ERROR,
  AVA_LISTINGS_ERROR,
  aiFiltersToBrowseParams,
  avaFallbackAnswer,
  composeAvaReply,
  hasAvaQuestion,
  readAvaResponse,
  shouldSearchForAva,
  type AvaAnswer,
  type AvaTurn,
} from "@repo/utils";

import type { BrowseApartment } from "@/app/browse/lib/browse-apartment";
import { fetchAvaResults } from "@/app/browse/lib/fetch-ava-results";

export interface AvaChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  quickReplies?: string[];
  /** Real listings found with the filters Ava understood. */
  listings?: BrowseApartment[];
  /** The Browse query for those listings, for "See all results". */
  browseParams?: Record<string, string>;
}

let messageSequence = 0;
const nextMessageId = () => `ava-${Date.now()}-${(messageSequence += 1)}`;

const toTurns = (messages: AvaChatMessage[]): AvaTurn[] =>
  messages.map((message) => ({ role: message.role, text: message.text }));

async function askAva(
  supabase: ReturnType<typeof createClient>,
  turns: AvaTurn[],
): Promise<AvaAnswer> {
  if (!hasAvaQuestion(turns)) return avaFallbackAnswer(turns);

  const { data, error } = await supabase.functions.invoke("ai-search", {
    body: { messages: turns },
  });
  if (error || !data) {
    console.error("Ava request failed:", error?.message ?? "empty response");
    return avaFallbackAnswer(turns);
  }
  return readAvaResponse(data, turns);
}

// Ava, the APT Virtual Assistant (web). The conversation stays in component
// state and is never stored. Reading Gemini's answer, the keyword fallback and
// what Ava says come from `@repo/utils` (`avaChat.ts`), shared with mobile.
export function useAvaChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<AvaChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // Bumped by resetChat so a reply still in flight never lands in the new chat.
  const chatGenerationRef = useRef(0);

  const sendMessage = useCallback(
    async (text?: string) => {
      const trimmed = (text ?? input).trim();
      if (!trimmed || isLoading) return;

      const userMessage: AvaChatMessage = { id: nextMessageId(), role: "user", text: trimmed };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);

      const generation = chatGenerationRef.current;
      const isCurrentChat = () => generation === chatGenerationRef.current;
      const reply = (message: Omit<AvaChatMessage, "id" | "role">) => {
        if (!isCurrentChat()) return;
        setMessages((prev) => [...prev, { id: nextMessageId(), role: "assistant", ...message }]);
      };

      try {
        const supabase = createClient();
        const answer = await askAva(supabase, toTurns([...messages, userMessage]));

        if (!shouldSearchForAva(answer)) {
          reply(composeAvaReply(answer, null));
          return;
        }

        const browseParams = aiFiltersToBrowseParams(answer.filters);
        let listings: BrowseApartment[];
        try {
          listings = await fetchAvaResults(supabase, browseParams);
        } catch (err) {
          console.error("Ava listings failed:", err);
          reply({ text: AVA_LISTINGS_ERROR });
          return;
        }

        reply({ ...composeAvaReply(answer, listings.length), listings, browseParams });
      } catch (err) {
        console.error("Ava chat failed:", err);
        reply({ text: AVA_GENERIC_ERROR });
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
