"use client";

import { useState } from "react";
import { Modal } from "@heroui/react";
import { IconX } from "@tabler/icons-react";
import MaintenanceForm from "./MaintenanceForm";
import PropertyContextCard from "./PropertyContextCard";

interface MaintenanceRequestModalProps {
  apartmentId: string;
  apartmentName: string;
  address: string;
  landlordName: string;
  imageUrl: string | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted: () => Promise<void>;
}

export default function MaintenanceRequestModal({ isOpen, onOpenChange, onSubmitted, apartmentId, ...property }: MaintenanceRequestModalProps) {
  const [saving, setSaving] = useState(false);
  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!saving) onOpenChange(open); }}>
      <Modal.Backdrop isDismissable={!saving} isKeyboardDismissDisabled={saving}>
        <Modal.Container size="lg" scroll="inside" placement="center">
          <Modal.Dialog className="w-full max-w-5xl!">
            <Modal.CloseTrigger className="maintenance-modal-close" aria-label="Close maintenance request" isDisabled={saving}>
              <IconX size={16} aria-hidden="true" />
            </Modal.CloseTrigger>
            <Modal.Header className="pr-12">
              <Modal.Heading className="font-nunito text-xl font-bold text-foreground">Request Maintenance</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="space-y-6">
              <PropertyContextCard {...property} />
              <MaintenanceForm apartmentId={apartmentId} embedded onSubmittingChange={setSaving} onSubmitted={async () => {
                await onSubmitted();
                onOpenChange(false);
              }} />
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
