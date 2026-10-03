"use client";

import { Suspense } from "react";

import { Modal } from "@heroui/react";
import { IconX } from "@tabler/icons-react";

import { RateApartmentForm } from "./RateApartmentForm";

interface RateApartmentModalProps {
  apartmentId: string;
  tenancyId?: string | null;
  reviewId?: string | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function RateApartmentModal({
  apartmentId,
  tenancyId,
  reviewId,
  isOpen,
  onOpenChange,
  onSuccess,
}: RateApartmentModalProps) {
  const isEditMode = reviewId != null;

  const handleClose = () => onOpenChange(false);

  const handleSuccess = () => {
    handleClose();
    onSuccess?.();
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container size="lg" scroll="inside" className="w-full max-w-4xl">
          <Modal.Dialog className="w-full md:max-w-4xl">
            <Modal.Header>
              <Modal.Heading className="font-nunito font-bold">{isEditMode ? "Edit Review" : "Rate Apartment"}</Modal.Heading>
              <Modal.CloseTrigger
                aria-label="Close"
                className="rounded-full border border-border bg-muted p-1.5 text-foreground hover:bg-muted"
              >
                <IconX size={18} strokeWidth={2.5} />
              </Modal.CloseTrigger>
            </Modal.Header>
            <Modal.Body>
              <Suspense fallback={<p className="text-sm text-muted-foreground">Loading review details…</p>}>
                {isOpen && (
                  <RateApartmentForm
                    apartmentIdOverride={apartmentId}
                    tenancyIdOverride={tenancyId ?? null}
                    reviewIdOverride={reviewId ?? null}
                    hideBackButton
                    showApartmentInfo={false}
                    onSuccess={handleSuccess}
                    onCancel={handleClose}
                  />
                )}
              </Suspense>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
