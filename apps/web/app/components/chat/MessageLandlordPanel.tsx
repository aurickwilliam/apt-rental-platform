"use client";

import { useMemo } from "react";

import dynamic from "next/dynamic";

import { Button, Separator } from "@heroui/react";
import { IconX } from "@tabler/icons-react";

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
    <div
      data-fab-clearance="message-panel"
      className="fixed bottom-6 right-6 z-40 flex max-h-[calc(100vh-3rem)] w-[360px] max-w-[90vw] flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-lg"
    >
      <div className="flex shrink-0 flex-row items-center justify-between gap-3 p-4">
        <h3 className="text-base font-semibold text-foreground">Message</h3>
        <Button isIconOnly variant="tertiary" size="sm" aria-label="Close message" onPress={() => onOpenChange(false)}>
          <IconX size={18} />
        </Button>
      </div>

      <Separator className="shrink-0" />

      <div className="flex h-[450px] min-h-0 flex-col overflow-hidden">
        <ConversationView
          activeContact={activeContact}
          currentUserId={currentUserId}
          apartmentId={apartmentId}
        />
      </div>
    </div>
  );
}
