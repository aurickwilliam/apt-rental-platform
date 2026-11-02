"use client";

import { useState, type ReactNode } from "react";
import { Tabs, ScrollShadow } from "@heroui/react";
import type { Contact, TabKey } from "./types";
import { IconMessageQuestion, IconSearch, IconUsers } from "@tabler/icons-react";
import ConversationRow from "@/app/components/chat/ConversationRow";
import ConversationListEmpty from "@/app/components/chat/ConversationListEmpty";
import ArchivedConversations from "@/app/components/chat/ArchivedConversations";
import ArchiveToggleButton from "@/app/components/chat/ArchiveToggleButton";
import ConversationSearchField from "@/app/components/chat/ConversationSearchField";
import { useConversationSearch } from "@/hooks/use-conversation-search";
import { filterConversationContacts } from "@/lib/conversation-search";

interface ContactSidebarProps {
  contacts: Contact[];
  activeTab: TabKey;
  activeContact: Contact | null;
  onTabChange: (key: TabKey) => void;
  onSelectContact: (contact: Contact) => void;
  /** Archived inquiries (current tenants can't be archived). */
  archivedContacts: Contact[];
  /** The row's "···" menu; `pinLocked` rows are pinned by the app. */
  renderMenu: (contact: Contact, pinLocked: boolean) => ReactNode;
  className?: string;
}

const EMPTY_STATES = {
  current: { icon: IconUsers, title: "No tenant conversations yet", description: "Messages with your current tenants will show up here." },
  inquiries: { icon: IconMessageQuestion, title: "No inquiries yet", description: "When someone asks about one of your listings, you'll see their message here." },
} as const;

export default function ContactSidebar({ contacts, activeTab, activeContact, onTabChange, onSelectContact, archivedContacts, renderMenu, className = "" }: ContactSidebarProps) {
  const [showArchived, setShowArchived] = useState(false);
  const { query, setQuery, recent, remember, clearRecent } = useConversationSearch();
  const visibleContacts = filterConversationContacts(contacts, query);
  const isSearching = query.trim() !== "";
  // Opening a result from a search keeps that search in the recents.
  const selectContact = (contact: Contact) => {
    if (isSearching) remember(query);
    onSelectContact(contact);
  };
  // Current tenants are pinned by the app, so Pin and Archive are locked there.
  const pinLocked = activeTab === "current";
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
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="font-nunito text-3xl font-bold text-primary">Messages</h2>
              <ArchiveToggleButton count={archivedContacts.length} onPress={() => setShowArchived(true)} />
            </div>
            <div className="mb-3">
              <ConversationSearchField query={query} onQueryChange={setQuery} recent={recent} onRemember={remember} onClearRecent={clearRecent} />
            </div>
            <Tabs className="apt-messages-categories" selectedKey={activeTab} onSelectionChange={(key) => onTabChange(key as TabKey)}>
              <Tabs.ListContainer><Tabs.List aria-label="Message categories">
                <Tabs.Tab id="current">Current Tenants<Tabs.Indicator /></Tabs.Tab>
                <Tabs.Tab id="inquiries"><Tabs.Separator />Inquiries<Tabs.Indicator /></Tabs.Tab>
              </Tabs.List></Tabs.ListContainer>
            </Tabs>
          </div>
          <ScrollShadow className="min-h-0 flex-1 overflow-y-auto p-2" visibility="none">
            {contacts.length === 0 ? <ConversationListEmpty {...EMPTY_STATES[activeTab]} /> : visibleContacts.length === 0 ? (
              <ConversationListEmpty icon={IconSearch} title="No matches" description={`Nothing in ${activeTab === "current" ? "Current Tenants" : "Inquiries"} matches “${query.trim()}”.`} />
            ) : visibleContacts.map((contact) => (
              <ConversationRow key={contact.conversationKey} contact={contact} isActive={activeContact?.conversationKey === contact.conversationKey} onSelect={() => selectContact(contact)} menu={renderMenu(contact, pinLocked)} />
            ))}
          </ScrollShadow>
        </>
      )}
    </div>
  );
}
