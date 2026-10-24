"use client";

import { useState } from "react";
import { Button, Modal, useOverlayState } from "@heroui/react";
import { IconX } from "@tabler/icons-react";
import { formatPesoDisplay } from "@repo/utils";
import ReconciliationNotice from "@/app/components/display/ReconciliationNotice";
import { useLandlordPaymentConfirmation } from "@/hooks/use-landlord-payments";
import { useReconciledAction } from "@/hooks/use-reconciled-action";
import type { LandlordPaymentRecord } from "@/service/landlordPaymentService";
import PaymentReceipt from "./PaymentReceipt";

type Step = "idle" | "confirm" | "decline";

interface PaymentReceiptModalProps {
  payment: LandlordPaymentRecord;
  onClose: () => void;
  /** Reloads the payments after a change; resolves true once the latest rows are verified. */
  onChanged: () => Promise<boolean>;
}

// The receipt opens over the list instead of on its own page. A cash payment
// that is waiting for the landlord is confirmed or declined inside the receipt
// (the second step replaces the buttons, so no dialog is stacked on a dialog).
// Mount it with `key={payment.id}`: the action lock belongs to one payment.
// Only the receipt shows: the dialog is transparent, and it closes with the X, a tap outside or Escape.
export default function PaymentReceiptModal({ payment, onClose, onChanged }: PaymentReceiptModalProps) {
  const state = useOverlayState({ isOpen: true, onOpenChange: (open) => { if (!open) onClose(); } });
  const [step, setStep] = useState<Step>("idle");
  const confirmation = useLandlordPaymentConfirmation();
  const action = useReconciledAction(onChanged);
  const blocked = action.blocked || confirmation.pending;
  const awaitingCash = payment.status === "pending" && payment.method === "cash";

  const choose = (next: Step) => {
    confirmation.clearError();
    setStep(next);
  };

  const submit = async (kind: "confirm" | "decline") => {
    const result = await action.run(() => (kind === "confirm" ? confirmation.confirm(payment.id) : confirmation.reject(payment.id)));
    if (result === "confirmed" || result === "unresolved") setStep("idle");
  };

  const amount = formatPesoDisplay(payment.amount ?? 0);
  const who = payment.tenant_name ?? "the tenant";

  const footer = (
    <div className="space-y-3">
      <ReconciliationNotice pending={action.pending} error={action.error} onRetry={() => void action.retry()} />
      {confirmation.error ? <p role="alert" className="text-center text-sm text-red-600">{confirmation.error}</p> : null}

      {awaitingCash && step === "idle" ? (
        <>
          <p className="text-center text-xs text-zinc-500">Paid in cash? Confirm once you have received the money.</p>
          <div className="flex gap-3">
            <Button variant="danger-soft" className="flex-1 rounded-full font-nunito" isDisabled={blocked} onPress={() => choose("decline")}>
              Decline
            </Button>
            <Button className="flex-1 rounded-full font-nunito" isDisabled={blocked} onPress={() => choose("confirm")}>
              Mark as paid
            </Button>
          </div>
        </>
      ) : null}

      {awaitingCash && step !== "idle" ? (
        <div role="group" aria-label={step === "confirm" ? "Confirm cash payment" : "Decline cash payment"} className="space-y-3 rounded-xl bg-zinc-50 p-3">
          <p className="text-center text-sm text-zinc-700">
            {step === "confirm"
              ? `Confirm you received ${amount} in cash from ${who}? They will be notified.`
              : `Decline this ${amount} cash payment? ${payment.tenant_name ?? "The tenant"} can submit another request.`}
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1 rounded-full font-nunito" isDisabled={blocked} onPress={() => choose("idle")}>
              Back
            </Button>
            {step === "confirm" ? (
              <Button className="flex-1 rounded-full font-nunito" isDisabled={blocked} onPress={() => void submit("confirm")}>
                {action.pending ? "Updating receipt…" : confirmation.pending ? "Confirming…" : "Yes, I received it"}
              </Button>
            ) : (
              <Button variant="danger" className="flex-1 rounded-full font-nunito" isDisabled={blocked} onPress={() => void submit("decline")}>
                {action.pending ? "Updating receipt…" : confirmation.pending ? "Declining…" : "Yes, decline"}
              </Button>
            )}
          </div>
        </div>
      ) : null}

      {!awaitingCash ? (
        <p className="text-center text-xs text-zinc-500">
          {payment.status === "pending"
            ? "Waiting for the payment provider to confirm this payment."
            : payment.status === "paid"
              ? "Thank you. This payment is recorded in your income."
              : "No money was recorded for this payment."}
        </p>
      ) : null}
    </div>
  );

  return (
    <Modal.Root state={state}>
      <Modal.Backdrop isDismissable>
        <Modal.Container placement="center" size="md" className="px-4">
          {/* Transparent on purpose, as an inline style: HeroUI's unlayered `.modal__dialog` background beats a class. Only the paper is visible. */}
          <Modal.Dialog
            aria-label="Payment receipt"
            className="max-h-[92vh] overflow-y-auto"
            style={{ backgroundColor: "transparent", boxShadow: "none", border: "none" }}
          >
            <Modal.CloseTrigger style={{ backgroundColor: "rgba(255, 255, 255, 0.2)", color: "#ffffff", top: 4, right: 8 }}>
              <IconX size={18} className="text-white" />
            </Modal.CloseTrigger>
            <Modal.Body className="px-0 pb-4 pt-12">
              <PaymentReceipt payment={payment} footer={footer} />
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal.Root>
  );
}
