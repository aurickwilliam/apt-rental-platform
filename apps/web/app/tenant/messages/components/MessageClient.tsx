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
  const [selectedConversationKey, setSelectedConversationKey] = useState<string | null>(
    myLandlord[0]?.conversationKey ?? pastInquiries[0]?.conversationKey ?? null
  );

  const contacts = [...myLandlordContacts, ...pastInquiryContacts];

  useEffect(() => {
    setMyLandlordContacts(myLandlord);
  }, [myLandlord]);

  useEffect(() => {
    setPastInquiryContacts(pastInquiries);
  }, [pastInquiries]);

  const markContactAsRead = useCallback((conversationKey: string) => {
    setMyLandlordContacts((prev) => {
      let changed = false;
      const next = prev.map((contact) => {
        if (contact.conversationKey === conversationKey && contact.unreadCount > 0) {
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
        if (contact.conversationKey === conversationKey && contact.unreadCount > 0) {
          changed = true;
          return { ...contact, unreadCount: 0 };
        }
        return contact;
      });
      return changed ? next : prev;
    });
  }, []);

  const incrementUnreadForContact = useCallback((conversationKey: string) => {
    setMyLandlordContacts((prev) => {
      let changed = false;
      const next = prev.map((contact) => {
        if (contact.conversationKey === conversationKey) {
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
        if (contact.conversationKey === conversationKey) {
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
        (payload: { new: { sender_id: string; apartment_id: string | null } }) => {
          const senderId = payload.new.sender_id;
          const apartmentId = payload.new.apartment_id ?? "none";
          const conversationKey = `${senderId}:${apartmentId}`;
          if (conversationKey === selectedConversationKey) {
            return;
          }
          incrementUnreadForContact(conversationKey);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, incrementUnreadForContact, selectedConversationKey, supabase]);

  const activeContact =
    contacts.find((contact) => contact.conversationKey === selectedConversationKey) ??
    contacts[0] ??
    null;

  return (
    <div className="mx-auto flex h-full w-full max-w-7xl min-h-0 overflow-hidden bg-white">
      <ContactSidebar
        myLandlord={myLandlordContacts}
        pastInquiries={pastInquiryContacts}
        activeContact={activeContact}
        onSelectContact={(contact) => {
          setSelectedConversationKey(contact.conversationKey);
          markContactAsRead(contact.conversationKey);
        }}
      />
      <ConversationView
        activeContact={activeContact}
        currentUserId={currentUserId}
        apartmentId={activeContact?.apartmentId}
        onConversationRead={markContactAsRead}
      />
    </div>
  );
}
