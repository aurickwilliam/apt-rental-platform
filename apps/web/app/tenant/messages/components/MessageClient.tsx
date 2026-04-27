"use client";

import { useState } from "react";
import ContactSidebar from "./ContactSidebar";
import ConversationView from "./ConversationView";
import { Contact } from "./types";

interface MessagesClientProps {
  myLandlord: Contact[];
  pastInquiries: Contact[];
  currentUserId: string;
}

export default function MessagesClient({ myLandlord, pastInquiries, currentUserId }: MessagesClientProps) {
  const contacts = [...myLandlord, ...pastInquiries];
  const [selectedContactId, setSelectedContactId] = useState<string | null>(myLandlord[0]?.id ?? pastInquiries[0]?.id ?? null);

  const activeContact =
    contacts.find((contact) => contact.id === selectedContactId) ?? contacts[0] ?? null;

  return (
    <div className="mx-auto flex h-full w-full max-w-7xl min-h-0 overflow-hidden bg-white">
      <ContactSidebar
        myLandlord={myLandlord}
        pastInquiries={pastInquiries}
        activeContact={activeContact}
        onSelectContact={(contact) => setSelectedContactId(contact.id)}
      />
      <ConversationView
        activeContact={activeContact}
        currentUserId={currentUserId}
      />
    </div>
  );
}
