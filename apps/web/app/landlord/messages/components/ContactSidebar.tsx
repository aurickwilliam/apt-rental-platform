"use client";

import { Tabs, ScrollShadow } from "@heroui/react";
import type { Contact, TabKey } from "./types";
import ConversationRow from "@/app/components/chat/ConversationRow";

interface ContactSidebarProps {
  contacts: Contact[];
  activeTab: TabKey;
  activeContact: Contact | null;
  onTabChange: (key: TabKey) => void;
  onSelectContact: (contact: Contact) => void;
  className?: string;
}

export default function ContactSidebar({ contacts, activeTab, activeContact, onTabChange, onSelectContact, className = "" }: ContactSidebarProps) {
  return (
    <div data-fab-clearance="messages-contact-list" className={`w-full min-h-0 flex-col border-r border-border bg-card lg:w-80 lg:shrink-0 xl:w-88 ${className}`}>
      <div className="border-b border-border px-5 py-4">
        <h2 className="mb-3 font-nunito text-lg font-bold">Conversations</h2>
        <Tabs className="apt-messages-categories" selectedKey={activeTab} onSelectionChange={(key) => onTabChange(key as TabKey)}>
          <Tabs.ListContainer><Tabs.List aria-label="Message categories">
            <Tabs.Tab id="current">Current Tenants<Tabs.Indicator /></Tabs.Tab>
            <Tabs.Tab id="inquiries"><Tabs.Separator />Inquiries<Tabs.Indicator /></Tabs.Tab>
          </Tabs.List></Tabs.ListContainer>
        </Tabs>
      </div>
      <ScrollShadow className="min-h-0 flex-1 overflow-y-auto p-2" visibility="none">
        {contacts.length === 0 ? <p className="px-3 py-6 text-xs text-muted-foreground">No messages in this category.</p> : contacts.map((contact) => (
          <ConversationRow key={contact.conversationKey} contact={contact} isActive={activeContact?.conversationKey === contact.conversationKey} onSelect={() => onSelectContact(contact)} />
        ))}
      </ScrollShadow>
    </div>
  );
}
