"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Drawer } from "@heroui/react";
import { IconArrowsMaximize, IconHistory, IconMessagePlus, IconX } from "@tabler/icons-react";

import { useAvaChat } from "@/hooks/use-ava-chat";
import { avaPageHref } from "@/lib/ava-page";

import AvaChatView from "./AvaChatView";
import AvaHistoryList from "./AvaHistoryList";

interface AvaChatDrawerProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  /** Browse base path for listing links and "See all results" (tenant: `/tenant/browse`). */
  basePath: string;
}

/**
 * Ava, the APT Virtual Assistant, in a right-hand HeroUI drawer: a quiet,
 * conversation-first panel that mirrors the mobile chat. The conversation
 * lives in `useAvaChat` and survives closing the drawer until "New chat"; past
 * conversations are in the history view, and Expand opens the full page.
 */
export default function AvaChatDrawer({ isOpen, onOpenChange, basePath }: AvaChatDrawerProps) {
  const router = useRouter();
  const chat = useAvaChat();
  const { messages, isLoading, resetChat, chats, activeChatId, openChat, deleteChat } = chat;
  const [view, setView] = useState<"chat" | "history">("chat");

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  const expand = useCallback(() => {
    close();
    router.push(avaPageHref(activeChatId));
  }, [activeChatId, close, router]);

  const showingHistory = view === "history";

  return (
    <Drawer isOpen={isOpen} onOpenChange={onOpenChange}>
      <Drawer.Backdrop>
        <Drawer.Content placement="right">
          <Drawer.Dialog
            aria-label="Ava, APT Virtual Assistant"
            className="flex h-full w-[calc(100vw-1rem)] max-w-lg flex-col overflow-hidden rounded-l-3xl bg-background p-0"
          >
            <Drawer.Header className="flex flex-row items-center gap-1 px-3 py-3">
              <Button
                isIconOnly
                variant="ghost"
                size="sm"
                onPress={() => setView(showingHistory ? "chat" : "history")}
                aria-label={showingHistory ? "Back to the chat" : "Show chat history"}
                aria-pressed={showingHistory}
                className="cursor-pointer"
              >
                <IconHistory size={20} aria-hidden />
              </Button>
              <Button
                isIconOnly
                variant="ghost"
                size="sm"
                onPress={() => {
                  resetChat();
                  setView("chat");
                }}
                isDisabled={messages.length === 0 && !showingHistory}
                aria-label="Start a new chat"
                className="cursor-pointer"
              >
                <IconMessagePlus size={20} aria-hidden />
              </Button>
              <div className="min-w-0 flex-1 text-center">
                <Drawer.Heading className="font-nunito text-lg font-bold leading-tight">
                  {showingHistory ? "History" : "Ava"}
                </Drawer.Heading>
                <p className="text-xs text-muted-foreground">APT Virtual Assistant</p>
              </div>
              <Button
                isIconOnly
                variant="ghost"
                size="sm"
                onPress={expand}
                isDisabled={isLoading}
                aria-label="Expand to full page"
                className="cursor-pointer"
              >
                <IconArrowsMaximize size={20} aria-hidden />
              </Button>
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

            {showingHistory ? (
              <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
                <AvaHistoryList
                  chats={chats}
                  activeChatId={activeChatId}
                  onOpen={(chatId) => {
                    void openChat(chatId);
                    setView("chat");
                  }}
                  onDelete={deleteChat}
                />
              </div>
            ) : (
              <AvaChatView chat={chat} basePath={basePath} onNavigate={close} />
            )}
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}
