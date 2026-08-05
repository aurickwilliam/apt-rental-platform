import { useCallback, useState } from "react";

export type AIChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: number;
  quickReplies?: string[];
};

export function useAIChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(
    async (text?: string) => {
      const trimmed = (text ?? input).trim();
      if (!trimmed || isLoading) return;

      const userMessage: AIChatMessage = {
        id: Date.now().toString(),
        role: "user",
        text: trimmed,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);

      try {
        // TODO: Replace with actual AI API call
        const assistantMessage: AIChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          text: "Casa here! I found a few apartments that might match what you're looking for. Let me narrow it down further — do you have a preferred area in Metro Manila?",
          timestamp: Date.now(),
          quickReplies: ["Caloocan", "Malabon", "Navotas", "Valenzuela"],
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch {
        const errorMessage: AIChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          text: "Sorry, I couldn't process that. Please try again.",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading]
  );

  return { input, setInput, messages, isLoading, sendMessage };
}