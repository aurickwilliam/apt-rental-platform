"use client";

import { useState } from "react";

import LandlordCard from "./LandlordCard";
import MessageLandlordPanel from "@/app/components/chat/MessageLandlordPanel";
import { useTranslation } from "@/app/components/i18n/LocaleProvider";
import { landlordProfileHref, type ProfileViewerPortal } from "@/lib/public-profile";

interface LandlordChatPanelProps {
  currentUserId: string | null;
  landlordId: string | null;
  landlordName: string;
  landlordAvatarUrl?: string | null;
  /** An admin approved one of the landlord's ownership documents. */
  isVerifiedLandlord?: boolean;
  apartmentId: string;
  apartmentName: string;
  /** Portal the apartment page renders in; decides which profile route the card opens. */
  profilePortal?: ProfileViewerPortal;
}

// Apartment-page entry point: the landlord card triggers the shared message
// panel with this apartment attached to the conversation.
export default function LandlordChatPanel({
  currentUserId,
  landlordId,
  landlordName,
  landlordAvatarUrl,
  isVerifiedLandlord = false,
  apartmentId,
  apartmentName,
  profilePortal = "public",
}: LandlordChatPanelProps) {
  const { t } = useTranslation();
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const isSelfLandlord = Boolean(currentUserId && landlordId && currentUserId === landlordId);
  const isMissingLandlord = !landlordId || !landlordName.trim();

  return (
    <>
      <LandlordCard
        name={landlordName}
        avatarUrl={landlordAvatarUrl}
        isVerified={isVerifiedLandlord}
        profileHref={landlordId ? landlordProfileHref(profilePortal, landlordId) : undefined}
        onMessagePress={() => setIsPanelOpen(true)}
        isMessageDisabled={isMissingLandlord}
        messageDisabledReason={
          isMissingLandlord ? t("apartment.landlord.unavailable") : ""
        }
        showMessageButton={!isSelfLandlord}
      />

      <MessageLandlordPanel
        isOpen={isPanelOpen}
        onOpenChange={setIsPanelOpen}
        currentUserId={currentUserId}
        landlordId={landlordId}
        landlordName={landlordName}
        landlordAvatarUrl={landlordAvatarUrl}
        apartmentId={apartmentId}
        apartmentName={apartmentName}
      />
    </>
  );
}
