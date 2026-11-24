"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { IconArrowsMinimize, IconHistory, IconMessagePlus } from "@tabler/icons-react";

import { useAvaChat } from "@/hooks/use-ava-chat";

import AvaChatView from "./AvaChatView";
import AvaHistoryList from "./AvaHistoryList";

interface AvaPageClientProps {
  /** Browse base path for listing links and "See all results". */
  basePath: string;
  /** A saved conversation to open (from `?chat=`). */
  initialChatId: string | null;
}

/**
 * Ava on a full page, in the style of Claude: a conversation sidebar on the
 * left, the chat centred in the middle. Same conversation state, history and
 * composer as the drawer. Below `md` the sidebar becomes a toggled list.
 */
export default function AvaPageClient({ basePath, initialChatId }: AvaPageClientProps) {
  const router = useRouter();
  const chat = useAvaChat({ initialChatId });
  const { chats, activeChatId, openChat, deleteChat, resetChat, messages } = chat;
  const [showHistoryOnMobile, setShowHistoryOnMobile] = useState(false);

  const history = (
    <AvaHistoryList
      chats={chats}
      activeChatId={activeChatId}
      onOpen={(chatId) => {
        void openChat(chatId);
        setShowHistoryOnMobile(false);
      }}
      onDelete={deleteChat}
    />
  );

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] min-h-0 w-full overflow-hidden bg-background md:h-dvh">
      <aside
        aria-label="Conversations"
        className="hidden w-72 shrink-0 flex-col border-r border-border bg-card md:flex"
      >
        <div className="flex items-center gap-2 px-4 py-4">
          <Image src="/images/ava-icon.png" alt="" width={32} height={32} className="size-8" />
          <span className="font-nunito text-lg font-bold">Ava</span>
        </div>
        <div className="px-3 pb-2">
          <Button
            variant="tertiary"
            onPress={resetChat}
            className="w-full cursor-pointer justify-start gap-2 rounded-xl"
          >
            <IconMessagePlus size={18} aria-hidden />
            New chat
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">{history}</div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-1 border-b border-border px-3 py-2.5">
          <Button
            isIconOnly
            variant="ghost"
            size="sm"
            onPress={() => setShowHistoryOnMobile((open) => !open)}
            aria-label={showHistoryOnMobile ? "Back to the chat" : "Show chat history"}
            aria-pressed={showHistoryOnMobile}
            className="cursor-pointer md:hidden"
          >
            <IconHistory size={20} aria-hidden />
          </Button>
          <Button
            isIconOnly
            variant="ghost"
            size="sm"
            onPress={() => {
              resetChat();
              setShowHistoryOnMobile(false);
            }}
            isDisabled={messages.length === 0}
            aria-label="Start a new chat"
            className="cursor-pointer md:hidden"
          >
            <IconMessagePlus size={20} aria-hidden />
          </Button>
          <div className="min-w-0 flex-1 text-center md:text-left">
            <h1 className="font-nunito text-base font-bold leading-tight">APT Virtual Assistant</h1>
          </div>
          <Button
            isIconOnly
            variant="ghost"
            size="sm"
            onPress={() => router.push(basePath)}
            aria-label="Leave full page and go back to Browse"
            className="cursor-pointer"
          >
            <IconArrowsMinimize size={20} aria-hidden />
          </Button>
        </header>

        {showHistoryOnMobile ? (
          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2 md:hidden">{history}</div>
        ) : null}
        <div className={`min-h-0 flex-1 flex-col ${showHistoryOnMobile ? "hidden md:flex" : "flex"}`}>
          <AvaChatView chat={chat} basePath={basePath} variant="page" />
        </div>
      </section>
    </div>
  );
}
