"use client";

import { useState } from "react";
import ContactSidebar from "./ContactSidebar";
import ConversationView from "./ConversationView";
import { Contact, TabKey } from "./types";

interface MessagesClientProps {
  currentTenants: Contact[];
  inquiries: Contact[];
  currentUserId: string;
}

export default function MessagesClient({ currentTenants, inquiries, currentUserId }: MessagesClientProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("current");
  const [activeContact, setActiveContact] = useState<Contact | null>(currentTenants[0] ?? null);

  const contacts = activeTab === "current" ? currentTenants : inquiries;

  return (
    <div className="flex h-full bg-white overflow-hidden">
      <ContactSidebar
        contacts={contacts}
        activeTab={activeTab}
        activeContact={activeContact}
        onTabChange={setActiveTab}
        onSelectContact={setActiveContact}
      />
      <ConversationView
        activeContact={activeContact}
        currentUserId={currentUserId}
      />
    </div>
  );
}