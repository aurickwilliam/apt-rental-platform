"use client";

import { useMemo, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
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

      <Modal
        isOpen={isAuthModalOpen}
        onOpenChange={(open) => setIsAuthModalOpen(open)}
        placement="center"
        backdrop="blur"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Sign in to message
              </ModalHeader>
              <ModalBody className="text-sm text-default-500">
                You need an account to message the landlord and keep your
                inquiries in one place.
              </ModalBody>
              <ModalFooter className="flex flex-col gap-2">
                <Button
                  color="primary"
                  radius="full"
                  size="lg"
                  className="w-full"
                  as="a"
                  href="/sign-in"
                  onPress={onClose}
                >
                  Sign in
                </Button>
                <Button
                  variant="light"
                  radius="full"
                  size="lg"
                  className="w-full"
                  as="a"
                  href="/sign-up"
                  onPress={onClose}
                >
                  Sign up
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {isPanelOpen && activeContact && currentUserId ? (
        <div className="fixed bottom-6 right-6 z-40 w-[360px] max-w-[90vw]">
          <Card className="shadow-2xl border border-default-200">
            <CardHeader className="flex items-center justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-foreground">
                  Message
                </p>
              </div>
              <Button
                isIconOnly
                variant="light"
                radius="full"
                onPress={handleClosePanel}
              >
                <X size={18} />
              </Button>
            </CardHeader>
            <Divider />
            <CardBody className="p-0 h-[520px]">
              <ConversationView
                activeContact={activeContact}
                currentUserId={currentUserId}
                apartmentId={apartmentId}
              />
            </CardBody>
          </Card>
        </div>
      ) : null}
    </>
  );
}
