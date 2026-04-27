"use client";

import { useEffect, useState } from "react";
import ContactSidebar from "./ContactSidebar";
import ConversationView from "./ConversationView";
import { Contact } from "./types";

interface MessagesClientProps {
  myLandlord: Contact[];
  pastInquiries: Contact[];
  currentUserId: string;
}

export default function MessagesClient({ myLandlord, pastInquiries, currentUserId }: MessagesClientProps) {
  const [activeContact, setActiveContact] = useState<Contact | null>(myLandlord[0] ?? pastInquiries[0] ?? null);

  useEffect(() => {
    const allContacts = [...myLandlord, ...pastInquiries];
    if (!activeContact && allContacts.length > 0) {
      setActiveContact(allContacts[0]);
      return;
    }

    if (activeContact && !allContacts.some((contact) => contact.id === activeContact.id)) {
      setActiveContact(allContacts[0] ?? null);
    }
  }, [myLandlord, pastInquiries, activeContact]);

  return (
    <div className="flex h-svh min-h-0 overflow-hidden bg-white">
      <ContactSidebar
        myLandlord={myLandlord}
        pastInquiries={pastInquiries}
        activeContact={activeContact}
        onSelectContact={setActiveContact}
      />
      <ConversationView
        activeContact={activeContact}
        currentUserId={currentUserId}
      />
    </div>
  );
}
