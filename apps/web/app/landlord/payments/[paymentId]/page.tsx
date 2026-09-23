"use client";

import { Suspense, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Modal, Spinner, useOverlayState } from "@heroui/react";
import { ArrowLeft } from "lucide-react";
import { methodLabel, periodMonthLabel } from "@/app/tenant/payment/utils";
import ReceiptView from "@/app/tenant/payment/components/ReceiptView";
import { useLandlordPayment, useLandlordPaymentConfirmation } from "@/hooks/use-landlord-payments";

function ReceiptContent() {
  const router = useRouter();
  const params = useParams<{ paymentId: string }>();
  const paymentId = params.paymentId ?? null;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const confirmState = useOverlayState({ isOpen: confirmOpen, onOpenChange: setConfirmOpen });

  const paymentQuery = useLandlordPayment(paymentId);
  const payment = paymentQuery.payment;
  const confirmMutation = useLandlordPaymentConfirmation();

  const isCashPending = payment?.status === "pending" && payment?.method === "cash";

  const periodLabel = payment?.period_start
    ? `${periodMonthLabel(payment.due_date ?? payment.period_start)}, ${payment.period_start.slice(0, 4)}`
    : undefined;

  const handleConfirm = async () => {
    if (!paymentId) return;
    const ok = await confirmMutation.confirm(paymentId);
    if (ok) {
      setConfirmOpen(false);
      void paymentQuery.refetch();
    }
  };

  if (paymentQuery.loading || (!payment && !paymentQuery.error)) {
    return (
      <div className="min-h-[60vh] px-5 flex flex-col" style={{ backgroundColor: "#376BF5" }}>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
          <Spinner size="lg" color="current" className="text-white" />
          <p className="text-white text-base font-inter">Loading receipt…</p>
        </div>
      </div>
    );
  }

  if (paymentQuery.error || !payment) {
    return (
      <div className="min-h-[60vh] px-5 flex flex-col" style={{ backgroundColor: "#376BF5" }}>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
          <p className="text-white text-base font-inter">
            {paymentQuery.error ?? "We could not find this payment."}
          </p>
          <Button onPress={() => void paymentQuery.refetch()} className="bg-white text-primary rounded-full font-nunito">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-5 py-6 flex flex-col" style={{ backgroundColor: "#376BF5" }}>
      <Button
        variant="ghost"
        size="sm"
        onPress={() => router.back()}
        aria-label="Back"
        className="self-start bg-white/20 text-white rounded-full"
      >
        <ArrowLeft size={16} /> Back
      </Button>
      <div className="flex-1 flex flex-col items-center justify-center gap-4 w-full max-w-xl mx-auto py-6">
        <ReceiptView payment={payment} />
        {isCashPending ? (
          <Button
            onPress={() => {
              confirmMutation.clearError();
              setConfirmOpen(true);
            }}
            isDisabled={confirmMutation.pending}
            className="bg-white text-primary rounded-full font-nunito"
          >
            {confirmMutation.pending ? "Confirming…" : "Mark as Paid"}
          </Button>
        ) : payment.status === "pending" ? (
          <p className="text-white/70 text-sm font-inter text-center">Awaiting payment confirmation.</p>
        ) : null}
      </div>

      <Modal.Root state={confirmState}>
        <Modal.Backdrop>
          <Modal.Container placement="center" size="sm">
            <Modal.Dialog className="rounded-2xl">
              <Modal.Header className="text-base font-nunito font-semibold">Mark as Paid</Modal.Header>
              <Modal.Body className="space-y-2">
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  {`Confirm the ${methodLabel(payment.method)} payment for ${periodLabel ?? "this period"}? This notifies the tenant that their payment was received.`}
                </p>
                {confirmMutation.error ? (
                  <p className="text-sm text-red-600">{confirmMutation.error}</p>
                ) : null}
              </Modal.Body>
              <Modal.Footer className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onPress={() => setConfirmOpen(false)} className="rounded-full font-nunito">
                  Cancel
                </Button>
                <Button size="sm" onPress={() => void handleConfirm()} isDisabled={confirmMutation.pending} className="rounded-full font-nunito">
                  {confirmMutation.pending ? "Confirming…" : "Confirm"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal.Root>
    </div>
  );
}

export default function LandlordPaymentReceiptPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex flex-col items-center justify-center px-5" style={{ backgroundColor: "#376BF5" }}>
          <Spinner size="lg" color="current" className="text-white" />
          <p className="text-white mt-4 text-base font-inter text-center">Loading receipt…</p>
        </div>
      }
    >
      <ReceiptContent />
    </Suspense>
  );
}
