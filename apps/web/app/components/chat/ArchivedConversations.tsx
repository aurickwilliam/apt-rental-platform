"use client";

import type { ReactNode } from "react";
import { ScrollShadow } from "@heroui/react";
import { IconArchive, IconChevronLeft } from "@tabler/icons-react";

import ConversationListEmpty from "./ConversationListEmpty";
import ConversationRow from "./ConversationRow";
import type { ConversationContact } from "@/lib/conversation-contacts";

interface ArchivedConversationsProps<T extends ConversationContact> {
  contacts: T[];
  activeKey: string | null;
  onBack: () => void;
  onSelect: (contact: T) => void;
  renderMenu: (contact: T) => ReactNode;
}

/** The archived chats list that replaces the inbox (mobile's archived screen). */
export default function ArchivedConversations<T extends ConversationContact>({
  contacts,
  activeKey,
  onBack,
  onSelect,
  renderMenu,
}: ArchivedConversationsProps<T>) {
  return (
    <>
      <div className="flex items-center gap-2 border-b border-border px-3 py-4">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to messages"
          className="flex size-9 cursor-pointer items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <IconChevronLeft size={22} aria-hidden="true" />
        </button>
        <h2 className="font-nunito text-2xl font-bold text-primary">Archived</h2>
      </div>
      <ScrollShadow className="min-h-0 flex-1 overflow-y-auto p-2" visibility="none">
        {contacts.length === 0 ? (
          <ConversationListEmpty
            icon={IconArchive}
            title="No archived chats"
            description="Chats you archive stay here until you move them back to Messages."
          />
        ) : (
          contacts.map((contact) => (
            <ConversationRow
              key={contact.conversationKey}
              contact={contact}
              isActive={activeKey === contact.conversationKey}
              onSelect={() => onSelect(contact)}
              menu={renderMenu(contact)}
            />
          ))
        )}
      </ScrollShadow>
    </>
  );
}
