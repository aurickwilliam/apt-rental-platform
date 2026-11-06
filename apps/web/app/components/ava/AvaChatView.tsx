"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button, toast } from "@heroui/react";

import type { AvaChatState } from "@/hooks/use-ava-chat";
import { useFavorites } from "@/hooks/use-favorites";

import AvaComposer from "./AvaComposer";
import AvaMessage from "./AvaMessage";

const AVA_ICON = "/images/ava-icon.png";

const STARTER_SUGGESTIONS = [
  { label: "2BR under ₱15k", message: "2BR under ₱15k" },
  { label: "Near Malabon", message: "Apartments in Malabon" },
  { label: "With parking", message: "A place with parking" },
  { label: "Pet friendly", message: "Pet friendly apartment" },
] as const;

interface AvaChatViewProps {
  chat: AvaChatState;
  /** Browse base path for listing links and "See all results" (tenant: `/tenant/browse`). */
  basePath: string;
  /** Called before leaving for a listing or Browse, e.g. to close the drawer. */
  onNavigate?: () => void;
  /** The full page centres the conversation in a wider column. */
  variant?: "drawer" | "page";
}

/**
 * The conversation itself (messages, empty state, starter chips, composer),
 * shared by the drawer and the full-page view so both behave the same.
 */
export default function AvaChatView({ chat, basePath, onNavigate, variant = "drawer" }: AvaChatViewProps) {
  const { input, setInput, messages, isLoading, sendMessage } = chat;
  const router = useRouter();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [favoriteLoadingId, setFavoriteLoadingId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isPage = variant === "page";

  // Keep the newest message in view as replies arrive.
  useEffect(() => {
    const container = scrollRef.current;
    if (container) container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [messages.length, isLoading]);

  const openListing = useCallback(
    (apartmentId: string) => {
      onNavigate?.();
      router.push(`${basePath}/${apartmentId}`);
    },
    [basePath, onNavigate, router],
  );

  const seeAllHref = useCallback(
    (params: Record<string, string>) => {
      const query = new URLSearchParams(params).toString();
      return query ? `${basePath}?${query}` : basePath;
    },
    [basePath],
  );

  const handleToggleFavorite = useCallback(
    async (apartmentId: string) => {
      setFavoriteLoadingId(apartmentId);
      try {
        const saved = await toggleFavorite(apartmentId);
        if (saved) toast.success("Saved to favorites");
        else toast("Removed from favorites");
      } catch (err: unknown) {
        toast.danger((err as { message?: string })?.message ?? "Unable to update favorites");
      } finally {
        setFavoriteLoadingId(null);
      }
    },
    [toggleFavorite],
  );

  const column = isPage ? "mx-auto w-full max-w-3xl" : "w-full";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        ref={scrollRef}
        className={`min-h-0 flex-1 overflow-y-auto py-4 ${isPage ? "px-6" : "px-5"}`}
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
            <Image src={AVA_ICON} alt="" width={128} height={128} className={isPage ? "size-32" : "size-28"} />
            <h2 className="font-nunito text-3xl font-bold text-foreground">Hi, I&apos;m Ava</h2>
            <p className="max-w-md text-sm leading-6 text-muted-foreground">
              Tell me the kind of place you&apos;re looking for, in English or Tagalog, and
              I&apos;ll find listings that fit.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Please don&apos;t share personal details like your phone number.
            </p>
          </div>
        ) : (
          <div className={`${column} flex flex-col gap-6`}>
            {messages.map((message) => (
              <AvaMessage
                key={message.id}
                message={message}
                onOpenListing={openListing}
                seeAllHref={seeAllHref}
                onQuickReply={(text) => void sendMessage(text)}
                onNavigate={() => onNavigate?.()}
                isFavorite={isFavorite}
                favoriteLoadingId={favoriteLoadingId}
                onToggleFavorite={(apartmentId) => void handleToggleFavorite(apartmentId)}
                columns={isPage ? 3 : 2}
              />
            ))}

            {isLoading && (
              <div className="flex items-center gap-2" role="status">
                <Image src={AVA_ICON} alt="" width={32} height={32} className="size-8 animate-pulse" />
                <span className="text-sm text-muted-foreground">Thinking…</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className={`flex flex-col gap-2 pb-4 pt-2 ${isPage ? "px-6" : "px-4"}`}>
        <div className={`${column} flex flex-col gap-2`}>
          {messages.length === 0 && (
            <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1">
              {STARTER_SUGGESTIONS.map((suggestion) => (
                <Button
                  key={suggestion.message}
                  size="sm"
                  variant="tertiary"
                  onPress={() => void sendMessage(suggestion.message)}
                  aria-label={`Send suggestion: ${suggestion.message}`}
                  className="h-auto shrink-0 cursor-pointer whitespace-nowrap rounded-full px-3 py-1.5 text-sm"
                >
                  {suggestion.label}
                </Button>
              ))}
            </div>
          )}
          <AvaComposer
            value={input}
            onChange={setInput}
            onSend={() => void sendMessage()}
            isDisabled={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
