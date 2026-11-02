"use client";

import { useMemo } from "react";

import dynamic from "next/dynamic";

import AuthPromptModal from "@/app/components/ui/AuthPromptModal";
import type { Contact } from "@/app/tenant/messages/components/types";

// Split from the initial bundle: the chat thread (realtime + history) only
// loads after the panel opens.
const ConversationView = dynamic(() => import("@/app/tenant/messages/components/ConversationView"), {
  ssr: false,
  loading: () => <p className="p-4 text-sm text-muted-foreground">Loading chat…</p>,
});

interface MessageLandlordPanelProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: string | null;
  landlordId: string | null;
  landlordName: string;
  landlordAvatarUrl?: string | null;
  /** Null starts a general inquiry with no apartment attached (mobile parity). */
  apartmentId?: string | null;
  apartmentName?: string | null;
}

/**
 * One floating message thread, shared by the apartment page (apartment context)
 * and the public profile (general inquiry). Signed-out visitors get the sign-in
 * prompt instead of a thread.
 */
export default function MessageLandlordPanel({
  isOpen,
  onOpenChange,
  currentUserId,
  landlordId,
  landlordName,
  landlordAvatarUrl,
  apartmentId = null,
  apartmentName = null,
}: MessageLandlordPanelProps) {
  const isMissingLandlord = !landlordId || !landlordName.trim();

  const activeContact = useMemo<Contact | null>(() => {
    if (!landlordId) return null;
    return {
      id: landlordId,
      conversationKey: `${landlordId}:${apartmentId ?? "none"}`,
      name: landlordName.trim() || "Landlord",
      avatar: landlordAvatarUrl?.trim() || "",
      apartment: apartmentName?.trim() || "No apartment linked",
      apartmentId,
      unreadCount: 0,
    };
  }, [apartmentId, apartmentName, landlordAvatarUrl, landlordId, landlordName]);

  if (!isOpen || isMissingLandlord) return null;

  if (!currentUserId) {
    return (
      <AuthPromptModal
        isOpen
        onOpenChange={onOpenChange}
        title="Sign in to message"
        description="You need an account to message the landlord and keep your inquiries in one place."
      />
    );
  }

  if (!activeContact) return null;

  return (
    // A Messenger / Instagram style chat window docked to the bottom-right
    // corner (full screen on phones). The thread's own header carries the close button.
    <div
      data-fab-clearance="message-panel"
      className="fixed bottom-0 right-6 z-40 flex h-[min(520px,calc(100dvh-5rem))] w-[340px] flex-col overflow-hidden rounded-t-2xl border border-b-0 border-border bg-card text-card-foreground shadow-[0_0_24px_rgba(0,0,0,0.2)] max-sm:inset-0 max-sm:h-dvh max-sm:w-full max-sm:rounded-none max-sm:border-0"
    >
      <ConversationView
        activeContact={activeContact}
        currentUserId={currentUserId}
        apartmentId={apartmentId}
        onClose={() => onOpenChange(false)}
      />
    </div>
  );
}
