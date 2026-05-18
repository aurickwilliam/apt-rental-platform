"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import {
  Button,
  Card,
  Separator,
  Modal,
} from "@heroui/react";

import { X } from "lucide-react";

import LandlordCard from "./LandlordCard";
import ConversationView from "../../../tenant/messages/components/ConversationView";
import { Contact } from "../../../tenant/messages/components/types";

interface LandlordChatPanelProps {
  currentUserId: string | null;
  landlordId: string | null;
  landlordName: string;
  landlordAvatarUrl?: string | null;
  landlordContactInfo: string;
  apartmentId: string;
  apartmentName: string;
}

export default function LandlordChatPanel({
  currentUserId,
  landlordId,
  landlordName,
  landlordAvatarUrl,
  landlordContactInfo,
  apartmentId,
  apartmentName,
}: LandlordChatPanelProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const isSelfLandlord = Boolean(currentUserId && landlordId && currentUserId === landlordId);
  const isMissingLandlord = !landlordId || !landlordName.trim();

  const activeContact = useMemo<Contact | null>(() => {
    if (!landlordId) return null;
    const conversationKey = `${landlordId}:${apartmentId}`;
    return {
      id: landlordId,
      conversationKey,
      name: landlordName.trim() || "Landlord",
      avatar: landlordAvatarUrl?.trim() || "",
      apartment: apartmentName.trim() ? `Inquiring: ${apartmentName.trim()}` : "Inquiring",
      apartmentId,
      unreadCount: 0,
    };
  }, [apartmentId, apartmentName, landlordAvatarUrl, landlordId, landlordName]);

  const handleMessagePress = () => {
    if (isMissingLandlord) return;
    if (!currentUserId) {
      setIsAuthModalOpen(true);
      return;
    }
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
  };

  return (
    <>
      <LandlordCard
        name={landlordName}
        avatarUrl={landlordAvatarUrl}
        contactInfo={landlordContactInfo}
        onMessagePress={handleMessagePress}
        isMessageDisabled={isMissingLandlord}
        messageDisabledReason={
          isMissingLandlord ? "Landlord details are not available yet." : ""
        }
        showMessageButton={!isSelfLandlord}
      />

      <Modal>
        <Modal.Backdrop
          variant="blur"
          isOpen={isAuthModalOpen}
          onOpenChange={setIsAuthModalOpen}
        >
          <Modal.Container placement="center">
            <Modal.Dialog>
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Sign in to message</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="text-sm text-default-500">
                You need an account to message the landlord and keep your
                inquiries in one place.
              </Modal.Body>
              <Modal.Footer className="flex flex-col gap-2">
                <Button 
                  size="lg" 
                  className="w-full" 
                  slot="close"
                >
                  <Link href="/sign-in">
                    Sign in
                  </Link>
                </Button>
                <Button 
                  variant="tertiary" 
                  size="lg" 
                  className="w-full" 
                  slot="close"
                >
                  <Link href="/sign-up">
                    Sign up
                  </Link>
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      {isPanelOpen && activeContact && currentUserId ? (
        <div className="fixed bottom-6 right-6 z-40 w-[360px] max-w-[90vw] max-h-[calc(100vh-3rem)] flex flex-col overflow-hidden rounded-xl border border-default-200 bg-white shadow-lg">
          
          {/* Header */}
          <div className="flex flex-row items-center justify-between gap-3 p-4 shrink-0">
            <h3 className="text-base font-semibold text-foreground">Message</h3>
            <Button isIconOnly variant="tertiary" onPress={handleClosePanel} size="sm">
              <X size={18} />
            </Button>
          </div>

          <Separator className="shrink-0" />

          {/* ConversationView */}
          <div className="h-[450px] min-h-0 flex flex-col overflow-hidden">
            <ConversationView
              activeContact={activeContact}
              currentUserId={currentUserId}
              apartmentId={apartmentId}
            />
          </div>

        </div>
      ) : null}
    </>
  );
}
