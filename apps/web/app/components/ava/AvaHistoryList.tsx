"use client";

import { Button } from "@heroui/react";
import { IconTrash } from "@tabler/icons-react";

import { groupAvaChatsByAge, type AvaHistoryGroupLabel, type AvaSavedChat } from "@repo/utils";

const GROUP_LABELS: Record<AvaHistoryGroupLabel, string> = {
  today: "Today",
  week: "Previous 7 days",
  older: "Older",
};

interface AvaHistoryListProps {
  chats: AvaSavedChat[];
  activeChatId: string | null;
  onOpen: (chatId: string) => void;
  onDelete: (chatId: string) => void;
}

// Saved conversations, newest first, grouped by age. Shared by the drawer's
// history view and the full-page sidebar.
export default function AvaHistoryList({ chats, activeChatId, onOpen, onDelete }: AvaHistoryListProps) {
  if (chats.length === 0) {
    return (
      <p className="px-3 py-6 text-center text-sm text-muted-foreground">
        Your conversations with Ava will show up here.
      </p>
    );
  }

  return (
    <nav aria-label="Ava conversations" className="flex flex-col gap-4">
      {groupAvaChatsByAge(chats).map((group) => (
        <section key={group.label} className="flex flex-col gap-0.5">
          <h3 className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {GROUP_LABELS[group.label]}
          </h3>
          {group.chats.map((chat) => {
            const isActive = chat.id === activeChatId;
            return (
              <div
                key={chat.id}
                className={`group flex items-center gap-1 rounded-xl pr-1 ${
                  isActive ? "bg-muted" : "hover:bg-muted/60"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onOpen(chat.id)}
                  aria-current={isActive ? "true" : undefined}
                  className="min-w-0 flex-1 cursor-pointer truncate rounded-xl px-3 py-2 text-left text-sm text-foreground focus-visible:outline-2 focus-visible:outline-[#376BF5]"
                >
                  {chat.title}
                </button>
                <Button
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  onPress={() => onDelete(chat.id)}
                  aria-label={`Delete conversation: ${chat.title}`}
                  className="size-8 shrink-0 cursor-pointer text-muted-foreground md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
                >
                  <IconTrash size={16} aria-hidden />
                </Button>
              </div>
            );
          })}
        </section>
      ))}
    </nav>
  );
}
