"use client";

import { Button, Modal, useOverlayState } from "@heroui/react";
import { X } from "lucide-react";
import ReceiptView from "./ReceiptView";
import type { PaymentRecord } from "@/service/paymentService";

interface ReceiptModalProps {
  payment: PaymentRecord;
  state: ReturnType<typeof useOverlayState>;
  ctaLabel: string;
  onCtaPress: () => void;
}

// Mobile-aesthetic receipt as a popup: primary-blue dialog, white receipt
// card with the scalloped edge cut to the blue, white pill CTA.
// NOTE: the dialog background uses an inline style on purpose — HeroUI's
// unlayered `.modal__dialog` rule beats Tailwind's layered `bg-primary`,
// so a className would silently lose (same cascade issue as the old X icon).
// #376BF5 intentionally matches `--color-primary` in globals.css.
export default function ReceiptModal({ payment, state, ctaLabel, onCtaPress }: ReceiptModalProps) {
  return (
    <Modal.Root state={state}>
      <Modal.Backdrop>
        <Modal.Container placement="center" size="md" className="px-4">
          <Modal.Dialog className="rounded-2xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: "#376BF5" }}>
            <Modal.CloseTrigger style={{ backgroundColor: "rgba(255, 255, 255, 0.2)", color: "#ffffff", top: 8, right: 8 }}>
              <X size={18} className="text-white" />
            </Modal.CloseTrigger>
            <Modal.Body className="px-5 sm:px-8 pt-10 pb-6 flex flex-col items-center gap-4">
              <ReceiptView payment={payment} />
              <Button onPress={onCtaPress} className="bg-white text-primary rounded-full font-nunito">
                {ctaLabel}
              </Button>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal.Root>
  );
}
