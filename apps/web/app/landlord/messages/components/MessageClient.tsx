"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@repo/supabase/browser";
import ContactSidebar from "./ContactSidebar";
import ConversationView from "./ConversationView";
import { Contact, TabKey } from "./types";

interface MessagesClientProps {
  currentTenants: Contact[];
  inquiries: Contact[];
  currentUserId: string;
}

export default function MessagesClient({ currentTenants, inquiries, currentUserId }: MessagesClientProps) {
  const supabase = useMemo(() => createClient(), []);
  const [currentTenantContacts, setCurrentTenantContacts] = useState<Contact[]>(currentTenants);
  const [inquiryContacts, setInquiryContacts] = useState<Contact[]>(inquiries);
  const [activeTab, setActiveTab] = useState<TabKey>("current");
  const [activeContact, setActiveContact] = useState<Contact | null>(currentTenants[0] ?? null);

  // Mobile master-detail: the contact list and the thread each need the
  // full width, so only one is shown below md. Desktop shows both and
  // ignores this state.
  const [isThreadOpen, setIsThreadOpen] = useState(false);

  useEffect(() => {
    setCurrentTenantContacts(currentTenants);
  }, [currentTenants]);

  useEffect(() => {
    setInquiryContacts(inquiries);
  }, [inquiries]);

  const markContactAsRead = useCallback((conversationKey: string) => {
    setCurrentTenantContacts((prev) => {
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

    setInquiryContacts((prev) => {
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
    setCurrentTenantContacts((prev) => {
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

    setInquiryContacts((prev) => {
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
      .channel(`landlord-unread:${currentUserId}`)
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
          if (conversationKey === activeContact?.conversationKey) {
            return;
          }
          incrementUnreadForContact(conversationKey);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeContact?.conversationKey, currentUserId, incrementUnreadForContact, supabase]);

  const contacts = activeTab === "current" ? currentTenantContacts : inquiryContacts;

  return (
    <div className="flex flex-1 min-h-0 w-full overflow-hidden bg-card">
      <ContactSidebar
        contacts={contacts}
        activeTab={activeTab}
        activeContact={activeContact}
        onTabChange={setActiveTab}
        onSelectContact={(contact) => {
          setActiveContact(contact);
          markContactAsRead(contact.conversationKey);
          setIsThreadOpen(true);
        }}
        // Below md the list yields the full width to the open thread.
        className={isThreadOpen ? "hidden md:flex" : "flex"}
      />
      <ConversationView
        activeContact={activeContact}
        currentUserId={currentUserId}
        apartmentId={activeContact?.apartmentId}
        onConversationRead={markContactAsRead}
        onBack={() => setIsThreadOpen(false)}
        // The empty state only makes sense alongside the list on mobile.
        className={isThreadOpen ? "flex" : "hidden md:flex"}
      />
    </div>
  );
}