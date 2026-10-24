"use client";

import { useState, type ReactNode } from "react";
import { ScrollShadow } from "@heroui/react";
import type { Contact } from "./types";
import { IconMessageQuestion } from "@tabler/icons-react";
import ConversationRow from "@/app/components/chat/ConversationRow";
import ConversationListEmpty from "@/app/components/chat/ConversationListEmpty";
import ArchivedConversations from "@/app/components/chat/ArchivedConversations";
import ArchiveToggleButton from "@/app/components/chat/ArchiveToggleButton";

interface ContactSidebarProps {
  myLandlord: Contact[];
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
  const row = (contact: Contact, pinLocked: boolean) => <ConversationRow key={contact.conversationKey} contact={contact} isActive={activeContact?.conversationKey === contact.conversationKey} onSelect={() => onSelectContact(contact)} menu={renderMenu(contact, pinLocked)} />;
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
            <p className="mt-0.5 text-xs text-muted-foreground">Your rental conversations, in one place.</p>
          </div>
          <ScrollShadow className="min-h-0 flex-1 overflow-y-auto p-2" visibility="none">
            {myLandlord.length > 0 && <><h3 className="px-3 pb-2 pt-3 font-nunito text-xs font-bold text-brand">My Landlord</h3>{myLandlord.map((contact) => row(contact, true))}</>}
            <h3 className="px-3 pb-2 pt-5 font-nunito text-xs font-bold text-muted-foreground">Past Inquiries</h3>
            {pastInquiries.length > 0 ? pastInquiries.map((contact) => row(contact, false)) : <ConversationListEmpty icon={IconMessageQuestion} title="No past inquiries yet" description="Landlords you contact about a listing will appear here." />}
          </ScrollShadow>
        </>
      )}
    </div>
  );
}
