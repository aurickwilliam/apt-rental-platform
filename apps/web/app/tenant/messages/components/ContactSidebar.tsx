"use client";

import { useState, type ReactNode } from "react";
import { ScrollShadow } from "@heroui/react";
import type { Contact } from "./types";
import { IconMessageQuestion, IconSearch } from "@tabler/icons-react";
import ConversationRow from "@/app/components/chat/ConversationRow";
import ConversationListEmpty from "@/app/components/chat/ConversationListEmpty";
import ArchivedConversations from "@/app/components/chat/ArchivedConversations";
import ArchiveToggleButton from "@/app/components/chat/ArchiveToggleButton";
import ConversationSearchField from "@/app/components/chat/ConversationSearchField";
import { useConversationSearch } from "@/hooks/use-conversation-search";
import { filterConversationContacts } from "@/lib/conversation-search";

interface ContactSidebarProps {
  /** The current landlord(s), always pinned on top (shown even before any message). */
  myLandlord: Contact[];
  /** Every other conversation, pinned ones first. */
  pastInquiries: Contact[];
  activeContact: Contact | null;
  onSelectContact: (contact: Contact) => void;
  /** Archived past inquiries (your current landlord can't be archived). */
  archivedContacts: Contact[];
  /** The row's "···" menu; `pinLocked` rows are pinned by the app. */
  renderMenu: (contact: Contact, pinLocked: boolean) => ReactNode;
  className?: string;
}

export default function ContactSidebar({ myLandlord, pastInquiries, activeContact, onSelectContact, archivedContacts, renderMenu, className = "" }: ContactSidebarProps) {
  const [showArchived, setShowArchived] = useState(false);
  const { query, setQuery, recent, remember, clearRecent } = useConversationSearch();
  const isSearching = query.trim() !== "";
  // One list like mobile, with no section labels: the current landlord, then
  // the conversations you pinned, a divider, then everything else.
  const visibleLandlord = filterConversationContacts(myLandlord, query);
  const visibleInquiries = filterConversationContacts(pastInquiries, query);
  const pinnedRows = [...visibleLandlord, ...visibleInquiries.filter((contact) => contact.isPinned)];
  const otherRows = visibleInquiries.filter((contact) => !contact.isPinned);
  // Opening a result from a search keeps that search in the recents.
  const selectContact = (contact: Contact) => {
    if (isSearching) remember(query);
    onSelectContact(contact);
  };
  const row = (contact: Contact, pinLocked: boolean) => <ConversationRow key={contact.conversationKey} contact={contact} isActive={activeContact?.conversationKey === contact.conversationKey} onSelect={() => selectContact(contact)} menu={renderMenu(contact, pinLocked)} />;
  return (
    <div data-fab-clearance="messages-contact-list" className={`w-full min-h-0 flex-col border-r border-border bg-card lg:w-80 lg:shrink-0 xl:w-88 ${className}`}>
      {showArchived ? (
        <ArchivedConversations
          contacts={archivedContacts}
          activeKey={activeContact?.conversationKey ?? null}
          onBack={() => setShowArchived(false)}
          onSelect={onSelectContact}
          renderMenu={(contact) => renderMenu(contact, false)}
        />
      ) : (
        <>
          <div className="border-b border-border px-5 py-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-nunito text-3xl font-bold text-primary">Messages</h2>
              <ArchiveToggleButton count={archivedContacts.length} onPress={() => setShowArchived(true)} />
            </div>
            <div className="mt-3">
              <ConversationSearchField query={query} onQueryChange={setQuery} recent={recent} onRemember={remember} onClearRecent={clearRecent} />
            </div>
          </div>
          <ScrollShadow className="min-h-0 flex-1 overflow-y-auto p-2" visibility="none">
            {pinnedRows.length === 0 && otherRows.length === 0 ? (
              isSearching ? (
                <ConversationListEmpty icon={IconSearch} title="No matches" description={`No conversation matches “${query.trim()}”.`} />
              ) : (
                <ConversationListEmpty icon={IconMessageQuestion} title="No messages yet" description="Start a conversation with a landlord to see your messages here." />
              )
            ) : (
              <>
                {pinnedRows.map((contact) => row(contact, myLandlord.includes(contact)))}
                {pinnedRows.length > 0 && otherRows.length > 0 ? <div role="separator" className="mx-3 my-2 border-t border-border" /> : null}
                {otherRows.map((contact) => row(contact, false))}
              </>
            )}
          </ScrollShadow>
        </>
      )}
    </div>
  );
}
