"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@repo/supabase/browser";
import ContactSidebar from "./ContactSidebar";
import ConversationView from "./ConversationView";
import { Contact } from "./types";

interface MessagesClientProps {
  myLandlord: Contact[];
  pastInquiries: Contact[];
  currentUserId: string;
}

export default function MessagesClient({ myLandlord, pastInquiries, currentUserId }: MessagesClientProps) {
  const supabase = useMemo(() => createClient(), []);
  const [myLandlordContacts, setMyLandlordContacts] = useState<Contact[]>(myLandlord);
  const [pastInquiryContacts, setPastInquiryContacts] = useState<Contact[]>(pastInquiries);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(myLandlord[0]?.id ?? pastInquiries[0]?.id ?? null);

  const contacts = [...myLandlordContacts, ...pastInquiryContacts];

  useEffect(() => {
    setMyLandlordContacts(myLandlord);
  }, [myLandlord]);

  useEffect(() => {
    setPastInquiryContacts(pastInquiries);
  }, [pastInquiries]);

  const markContactAsRead = useCallback((contactId: string) => {
    setMyLandlordContacts((prev) => {
      let changed = false;
      const next = prev.map((contact) => {
        if (contact.id === contactId && contact.unreadCount > 0) {
          changed = true;
          return { ...contact, unreadCount: 0 };
        }
        return contact;
      });
      return changed ? next : prev;
    });

    setPastInquiryContacts((prev) => {
      let changed = false;
      const next = prev.map((contact) => {
        if (contact.id === contactId && contact.unreadCount > 0) {
          changed = true;
          return { ...contact, unreadCount: 0 };
        }
        return contact;
      });
      return changed ? next : prev;
    });
  }, []);

  const incrementUnreadForContact = useCallback((contactId: string) => {
    setMyLandlordContacts((prev) => {
      let changed = false;
      const next = prev.map((contact) => {
        if (contact.id === contactId) {
          changed = true;
          return { ...contact, unreadCount: contact.unreadCount + 1 };
        }
        return contact;
      });
      return changed ? next : prev;
    });

    setPastInquiryContacts((prev) => {
      let changed = false;
      const next = prev.map((contact) => {
        if (contact.id === contactId) {
          changed = true;
          return { ...contact, unreadCount: contact.unreadCount + 1 };
        }
        return contact;
      });
      return changed ? next : prev;
    });
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel(`tenant-unread:${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat",
          filter: `receiver_id=eq.${currentUserId}`,
        },
        (payload: { new: { sender_id: string } }) => {
          const senderId = payload.new.sender_id;
          if (senderId === selectedContactId) {
            return;
          }
          incrementUnreadForContact(senderId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, incrementUnreadForContact, selectedContactId, supabase]);

  const activeContact =
    contacts.find((contact) => contact.id === selectedContactId) ?? contacts[0] ?? null;

  return (
    <div className="mx-auto flex h-full w-full max-w-7xl min-h-0 overflow-hidden bg-white">
      <ContactSidebar
        myLandlord={myLandlordContacts}
        pastInquiries={pastInquiryContacts}
        activeContact={activeContact}
        onSelectContact={(contact) => {
          setSelectedContactId(contact.id);
          markContactAsRead(contact.id);
        }}
      />
      <ConversationView
        activeContact={activeContact}
        currentUserId={currentUserId}
        onConversationRead={markContactAsRead}
      />
    </div>
  );
}
