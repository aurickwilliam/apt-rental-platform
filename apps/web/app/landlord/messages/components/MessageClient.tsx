"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@repo/supabase/browser";
import { useNewConversationRefresh } from "@/hooks/use-new-conversation-refresh";
import { selectPortalConversation } from "@/lib/conversation-contacts";
import ContactSidebar from "./ContactSidebar";
import ConversationView from "./ConversationView";
import { Contact, TabKey } from "./types";

interface MessagesClientProps {
  currentTenants: Contact[];
  inquiries: Contact[];
  currentUserId: string;
  /** `?conversation=` deep link from a notification; unknown keys fall back. */
  initialConversationKey: string | null;
}

export default function MessagesClient({
  currentTenants,
  inquiries,
  currentUserId,
  initialConversationKey,
}: MessagesClientProps) {
  const supabase = useMemo(() => createClient(), []);
  const [currentTenantContacts, setCurrentTenantContacts] = useState<Contact[]>(currentTenants);
  const [inquiryContacts, setInquiryContacts] = useState<Contact[]>(inquiries);
  const deepLinkContact = selectPortalConversation(currentTenants, inquiries, initialConversationKey);
  // Only an exact deep-link match may change the portal default; otherwise the
  // landlord keeps its Current Tenants default selection.
  const initialContact =
    initialConversationKey !== null && deepLinkContact?.conversationKey === initialConversationKey
      ? deepLinkContact
      : currentTenants[0] ?? null;
  const [activeTab, setActiveTab] = useState<TabKey>(
    initialContact && inquiries.some((contact) => contact.conversationKey === initialContact.conversationKey)
      ? "inquiries"
      : "current"
  );
  const [activeContact, setActiveContact] = useState<Contact | null>(initialContact);

  // Mobile master-detail: the contact list and the thread each need the
  // full width, so only one is shown below md. Desktop shows both and
  // ignores this state. A resolved deep link opens the thread directly.
  const [isThreadOpen, setIsThreadOpen] = useState(
    initialConversationKey !== null && initialContact?.conversationKey === initialConversationKey
  );

  // Reset local contact state when the server sends new lists (React's
  // "adjust state on prop change" pattern; no effect round-trip).
  const [syncedTenants, setSyncedTenants] = useState(currentTenants);
  if (syncedTenants !== currentTenants) {
    setSyncedTenants(currentTenants);
    setCurrentTenantContacts(currentTenants);
  }
  const [syncedInquiries, setSyncedInquiries] = useState(inquiries);
  if (syncedInquiries !== inquiries) {
    setSyncedInquiries(inquiries);
    setInquiryContacts(inquiries);
  }

  const conversationKeys = useMemo(
    () => [...currentTenantContacts, ...inquiryContacts].map((contact) => contact.conversationKey),
    [currentTenantContacts, inquiryContacts]
  );
  const refreshIfNewConversation = useNewConversationRefresh(conversationKeys);

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

  // Notification deep link: apply each distinct `?conversation=` value the
  // server hands us, once, selecting the matching contact when it exists.
  const [syncedDeepLink, setSyncedDeepLink] = useState(initialConversationKey);
  if (syncedDeepLink !== initialConversationKey) {
    setSyncedDeepLink(initialConversationKey);
    const target = initialConversationKey
      ? [...currentTenantContacts, ...inquiryContacts].find(
          (contact) => contact.conversationKey === initialConversationKey
        ) ?? null
      : null;
    if (target) {
      setActiveContact(target);
      setActiveTab(
        inquiryContacts.some((contact) => contact.conversationKey === target.conversationKey)
          ? "inquiries"
          : "current"
      );
      markContactAsRead(target.conversationKey);
      setIsThreadOpen(true);
    }
  }

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
          // A chat that started while the page was open: reload the lists.
          if (refreshIfNewConversation(conversationKey)) return;
          incrementUnreadForContact(conversationKey);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeContact?.conversationKey, currentUserId, incrementUnreadForContact, refreshIfNewConversation, supabase]);

  const contacts = activeTab === "current" ? currentTenantContacts : inquiryContacts;

  return (
    // The thread and the contact list each scroll internally, so this frame
    // is pinned to the viewport. Without a definite height the whole column
    // outgrows the screen, `flex-1` resolves against unbounded height, and
    // the window becomes the scroller — dragging the header and composer off
    // screen. `pb-20`/`md:pb-0` on the portal `main` is mirrored here.
    <div className="flex h-[calc(100dvh-5rem)] min-h-0 w-full overflow-hidden bg-card md:h-dvh">
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
        // Tablet widths use one pane; the portal sidebar also needs room.
        className={isThreadOpen ? "hidden lg:flex" : "flex"}
      />
      <ConversationView
        activeContact={activeContact}
        currentUserId={currentUserId}
        apartmentId={activeContact?.apartmentId}
        onConversationRead={markContactAsRead}
        onBack={() => setIsThreadOpen(false)}
        // The empty state only makes sense alongside the list on mobile.
        className={isThreadOpen ? "flex" : "hidden lg:flex"}
      />
    </div>
  );
}
