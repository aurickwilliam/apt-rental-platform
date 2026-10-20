"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@repo/supabase/browser";
import { useNewConversationRefresh } from "@/hooks/use-new-conversation-refresh";
import { selectPortalConversation } from "@/lib/conversation-contacts";
import ContactSidebar from "./ContactSidebar";
import ConversationView from "./ConversationView";
import { Contact } from "./types";

interface MessagesClientProps {
  myLandlord: Contact[];
  pastInquiries: Contact[];
  currentUserId: string;
  /** `?conversation=` deep link from a notification; unknown keys fall back. */
  initialConversationKey: string | null;
}

export default function MessagesClient({
  myLandlord,
  pastInquiries,
  currentUserId,
  initialConversationKey,
}: MessagesClientProps) {
  const supabase = useMemo(() => createClient(), []);
  const [myLandlordContacts, setMyLandlordContacts] = useState<Contact[]>(myLandlord);
  const [pastInquiryContacts, setPastInquiryContacts] = useState<Contact[]>(pastInquiries);
  const deepLinkContact = selectPortalConversation(myLandlord, pastInquiries, initialConversationKey);
  const [selectedConversationKey, setSelectedConversationKey] = useState<string | null>(
    deepLinkContact?.conversationKey ?? null
  );

  // Mobile master-detail: the contact list and the thread each need the
  // full width, so only one is shown below md. Desktop shows both and
  // ignores this state. A resolved deep link opens the thread directly.
  const [isThreadOpen, setIsThreadOpen] = useState(
    initialConversationKey !== null && deepLinkContact?.conversationKey === initialConversationKey
  );

  const contacts = [...myLandlordContacts, ...pastInquiryContacts];
  const conversationKeys = useMemo(
    () => [...myLandlordContacts, ...pastInquiryContacts].map((contact) => contact.conversationKey),
    [myLandlordContacts, pastInquiryContacts]
  );
  const refreshIfNewConversation = useNewConversationRefresh(conversationKeys);

  // Reset local contact state when the server sends new lists (React's
  // "adjust state on prop change" pattern; no effect round-trip).
  const [syncedLandlord, setSyncedLandlord] = useState(myLandlord);
  if (syncedLandlord !== myLandlord) {
    setSyncedLandlord(myLandlord);
    setMyLandlordContacts(myLandlord);
  }
  const [syncedInquiries, setSyncedInquiries] = useState(pastInquiries);
  if (syncedInquiries !== pastInquiries) {
    setSyncedInquiries(pastInquiries);
    setPastInquiryContacts(pastInquiries);
  }

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

  // Notification deep link: apply each distinct `?conversation=` value the
  // server hands us, once, selecting the matching contact when it exists.
  const [syncedDeepLink, setSyncedDeepLink] = useState(initialConversationKey);
  if (syncedDeepLink !== initialConversationKey) {
    setSyncedDeepLink(initialConversationKey);
    const target = initialConversationKey
      ? contacts.find((contact) => contact.conversationKey === initialConversationKey) ?? null
      : null;
    if (target) {
      setSelectedConversationKey(target.conversationKey);
      markContactAsRead(target.conversationKey);
      setIsThreadOpen(true);
    }
  }

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
          // A chat that started while the page was open: reload the lists.
          if (refreshIfNewConversation(conversationKey)) return;
          incrementUnreadForContact(conversationKey);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, incrementUnreadForContact, refreshIfNewConversation, selectedConversationKey, supabase]);

  const activeContact =
    contacts.find((contact) => contact.conversationKey === selectedConversationKey) ??
    contacts[0] ??
    null;

  return (
    // The thread and the contact list each scroll internally, so this frame
    // is pinned to the viewport. Without a definite height the whole column
    // outgrows the screen, `flex-1` resolves against unbounded height, and
    // the window becomes the scroller — dragging the header and composer off
    // screen. `pb-20`/`md:pb-0` on the portal `main` is mirrored here.
    <div className="flex h-[calc(100dvh-5rem)] min-h-0 w-full overflow-hidden bg-card md:h-dvh">
      <ContactSidebar
        myLandlord={myLandlordContacts}
        pastInquiries={pastInquiryContacts}
        activeContact={activeContact}
        onSelectContact={(contact) => {
          setSelectedConversationKey(contact.conversationKey);
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
