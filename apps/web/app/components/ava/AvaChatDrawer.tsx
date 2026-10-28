"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button, Drawer, toast } from "@heroui/react";
import { IconMessagePlus, IconX } from "@tabler/icons-react";

import { useAvaChat } from "@/hooks/use-ava-chat";
import { useFavorites } from "@/hooks/use-favorites";

import AvaComposer from "./AvaComposer";
import AvaMessage from "./AvaMessage";

const AVA_LOGO = "/images/ava-logo.png";

const STARTER_SUGGESTIONS = [
  { title: "2 bedrooms", detail: "under ₱15,000", message: "2BR under ₱15k" },
  { title: "Near Malabon", detail: "any budget", message: "Apartments in Malabon" },
  { title: "With parking", detail: "for a car", message: "A place with parking" },
  { title: "Pet friendly", detail: "for dogs or cats", message: "Pet friendly apartment" },
] as const;

interface AvaChatDrawerProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  /** Browse base path for listing links and "See all results" (tenant: `/tenant/browse`). */
  basePath: string;
}

/**
 * Ava, the APT Virtual Assistant, in a right-hand HeroUI drawer: a quiet,
 * conversation-first panel that mirrors the mobile chat. The conversation
 * lives in `useAvaChat` and survives closing the drawer until "New chat".
 */
export default function AvaChatDrawer({ isOpen, onOpenChange, basePath }: AvaChatDrawerProps) {
  const router = useRouter();
  const { input, setInput, messages, isLoading, sendMessage, resetChat } = useAvaChat();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [favoriteLoadingId, setFavoriteLoadingId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep the newest message in view as replies arrive.
  useEffect(() => {
    const container = scrollRef.current;
    if (container) container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [messages.length, isLoading]);

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  const openListing = useCallback(
    (apartmentId: string) => {
      close();
      router.push(`${basePath}/${apartmentId}`);
    },
    [basePath, close, router],
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

  return (
    <Drawer isOpen={isOpen} onOpenChange={onOpenChange}>
      <Drawer.Backdrop>
        <Drawer.Content placement="right">
          <Drawer.Dialog
            aria-label="Ava, APT Virtual Assistant"
            className="flex h-full w-[calc(100vw-1rem)] max-w-lg flex-col bg-background p-0"
          >
            <Drawer.Header className="flex flex-row items-center gap-2 px-4 py-3">
              <Button
                isIconOnly
                variant="ghost"
                size="sm"
                onPress={resetChat}
                isDisabled={messages.length === 0}
                aria-label="Start a new chat"
                className={`cursor-pointer ${messages.length === 0 ? "invisible" : ""}`}
              >
                <IconMessagePlus size={20} aria-hidden />
              </Button>
              <div className="min-w-0 flex-1 text-center">
                <Drawer.Heading className="font-nunito text-lg font-bold leading-tight">Ava</Drawer.Heading>
                <p className="text-xs text-muted-foreground">APT Virtual Assistant</p>
              </div>
              <Button
                isIconOnly
                variant="ghost"
                size="sm"
                onPress={close}
                aria-label="Close Ava"
                className="cursor-pointer"
              >
                <IconX size={20} aria-hidden />
              </Button>
            </Drawer.Header>

            <Drawer.Body
              ref={scrollRef}
              className="min-h-0 flex-1 overflow-y-auto px-5 py-4"
              aria-live="polite"
            >
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
                  <Image src={AVA_LOGO} alt="" width={96} height={52} className="h-auto w-24" />
                  <h2 className="font-nunito text-3xl font-bold text-foreground">Hi, I&apos;m Ava</h2>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Tell me the kind of place you&apos;re looking for, in English or Tagalog, and
                    I&apos;ll find listings that fit.
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Please don&apos;t share personal details like your phone number.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {messages.map((message) => (
                    <AvaMessage
                      key={message.id}
                      message={message}
                      onOpenListing={openListing}
                      seeAllHref={seeAllHref}
                      onQuickReply={(text) => void sendMessage(text)}
                      onNavigate={close}
                      isFavorite={isFavorite}
                      favoriteLoadingId={favoriteLoadingId}
                      onToggleFavorite={(apartmentId) => void handleToggleFavorite(apartmentId)}
                    />
                  ))}

                  {isLoading && (
                    <div className="flex items-center gap-2" role="status">
                      <Image
                        src={AVA_LOGO}
                        alt=""
                        width={40}
                        height={22}
                        className="h-auto w-10 animate-pulse"
                      />
                      <span className="text-sm text-muted-foreground">Thinking…</span>
                    </div>
                  )}
                </div>
              )}
            </Drawer.Body>

            <Drawer.Footer className="flex-col items-stretch gap-2 px-4 pb-4 pt-2">
              {messages.length === 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {STARTER_SUGGESTIONS.map((suggestion) => (
                    <Button
                      key={suggestion.message}
                      variant="tertiary"
                      onPress={() => void sendMessage(suggestion.message)}
                      aria-label={`Send suggestion: ${suggestion.message}`}
                      className="h-auto cursor-pointer flex-col items-start gap-0.5 rounded-2xl border border-border bg-card px-4 py-3 text-left"
                    >
                      <span className="font-nunito text-sm font-semibold text-foreground">
                        {suggestion.title}
                      </span>
                      <span className="text-xs font-normal text-muted-foreground">{suggestion.detail}</span>
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
            </Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}
