"use client";

import { useCallback, useRef, useState } from "react";

import { createClient } from "@repo/supabase/browser";
import {
  AVA_STRINGS,
  aiFiltersToBrowseParams,
  answerAva,
  avaConversationLanguage,
  avaFallbackAnswer,
  buildAvaRequest,
  hasAvaQuestion,
  readAvaResponse,
  type AvaAnswer,
  type AvaSearchState,
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

const toTurns = (messages: AvaChatMessage[]): AvaTurn[] =>
  messages.map((message) => ({
    role: message.role,
    text: message.text,
    search: message.search,
    shownIds: message.shownIds,
  }));

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

// Ava, the APT Virtual Assistant (web). The conversation stays in component
// state and is never stored; each reply remembers the search it ran, so
// follow-ups ("show me more", "what if my budget is 8k?") build on it. Reading
// Gemini's answer, language, landmarks, distance ranking and what Ava says come
// from `@repo/utils` (`answerAva`), shared with mobile.
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

      let language = detectedLanguage(messages, trimmed);
      try {
        const supabase = createClient();
        const turns = toTurns([...messages, userMessage]);
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
            outcome.filters && !isDistanceSearch && outcome.listings.length > 0
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
