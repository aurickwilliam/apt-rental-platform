"use client";

import { Suspense, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Modal, useOverlayState } from "@heroui/react";
import { IconArrowLeft as ArrowLeft } from "@tabler/icons-react";
import { methodLabel, periodMonthLabel } from "@/app/tenant/payment/utils";
import ReceiptView from "@/app/tenant/payment/components/ReceiptView";
import { useLandlordPayment, useLandlordPaymentConfirmation } from "@/hooks/use-landlord-payments";
import { useAuthIdentity } from "@/hooks/use-auth-identity";
import { useReconciledAction } from "@/hooks/use-reconciled-action";
import ReconciliationNotice from "@/app/components/display/ReconciliationNotice";
import PaymentStatusLoading from "@/app/tenant/payment/components/PaymentStatusLoading";

function ReceiptContent() {
  const router = useRouter();
  const params = useParams<{ paymentId: string }>();
  const paymentId = params.paymentId ?? null;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const confirmState = useOverlayState({ isOpen: confirmOpen, onOpenChange: setConfirmOpen });
  const rejectState = useOverlayState({ isOpen: rejectOpen, onOpenChange: setRejectOpen });

  const paymentQuery = useLandlordPayment(paymentId);
  const payment = paymentQuery.payment;
  const confirmMutation = useLandlordPaymentConfirmation();
  const action = useReconciledAction(paymentQuery.revalidate);
  const actionsBlocked = action.blocked || confirmMutation.pending;

  const isCashPending = payment?.status === "pending" && payment?.method === "cash";

  const periodLabel = payment?.period_start
    ? `${periodMonthLabel(payment.due_date ?? payment.period_start)}, ${payment.period_start.slice(0, 4)}`
    : undefined;

  const handleConfirm = async () => {
    if (!paymentId) return;
    const result = await action.run(() => confirmMutation.confirm(paymentId));
    if (result === "confirmed" || result === "unresolved") {
      setConfirmOpen(false);
    }
  };

  const handleReject = async () => {
    if (!paymentId) return;
    const result = await action.run(() => confirmMutation.reject(paymentId));
    if (result === "confirmed" || result === "unresolved") {
      setRejectOpen(false);
    }
  };

  if (paymentQuery.loading) {
    return <PaymentStatusLoading message="Loading receipt…" receipt />;
  }

  if (paymentQuery.error || !payment) {
    return (
      <div className="min-h-[60vh] px-5 flex flex-col" style={{ backgroundColor: "#376BF5" }}>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
          <p className="text-white text-base font-inter">
            {paymentQuery.error ?? "We could not find this payment."}
          </p>
          <ReconciliationNotice pending={action.pending} error={action.error} onRetry={() => void action.retry()} />
          {!action.error && <Button isDisabled={action.pending} onPress={() => void action.retry()} className="bg-white text-primary rounded-full font-nunito">
            Try Again
          </Button>}
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
        <ReconciliationNotice pending={action.pending} error={action.error} onRetry={() => void action.retry()} />
        <ReceiptView payment={payment} />
        {isCashPending ? (
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              variant="danger"
              onPress={() => {
                confirmMutation.clearError();
                setRejectOpen(true);
              }}
              isDisabled={actionsBlocked}
            >
              Decline
            </Button>
            <Button
              onPress={() => {
                confirmMutation.clearError();
                setConfirmOpen(true);
              }}
              isDisabled={actionsBlocked}
              className="bg-white text-primary rounded-full font-nunito"
            >
              {confirmMutation.pending ? "Confirming…" : "Mark as Paid"}
            </Button>
          </div>
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
                <Button size="sm" onPress={() => void handleConfirm()} isDisabled={actionsBlocked || !isCashPending} className="rounded-full font-nunito">
                  {action.pending ? "Updating receipt…" : confirmMutation.pending ? "Confirming…" : "Confirm"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal.Root>

      <Modal.Root state={rejectState}>
        <Modal.Backdrop>
          <Modal.Container placement="center" size="sm">
            <Modal.Dialog className="rounded-2xl">
              <Modal.Header className="text-base font-nunito font-semibold">Decline Cash Payment</Modal.Header>
              <Modal.Body className="space-y-2">
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  Decline this cash payment for {periodLabel ?? "this period"}? The tenant will be able to submit another cash payment request.
                </p>
                {confirmMutation.error ? (
                  <p className="text-sm text-red-600">{confirmMutation.error}</p>
                ) : null}
              </Modal.Body>
              <Modal.Footer className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onPress={() => setRejectOpen(false)} className="rounded-full font-nunito">
                  Cancel
                </Button>
                <Button variant="danger" size="sm" onPress={() => void handleReject()} isDisabled={actionsBlocked || !isCashPending} className="rounded-full font-nunito">
                  {action.pending ? "Updating receipt…" : confirmMutation.pending ? "Declining…" : "Decline"}
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
  const identity = useAuthIdentity();
  const { paymentId } = useParams<{ paymentId: string }>();
  if (identity.authUserId === undefined) return <PaymentStatusLoading message="Loading receipt…" receipt />;
  if (!identity.authUserId) return <p role="alert" className="p-4">Sign in to view this receipt.</p>;
  return (
    <Suspense
      fallback={<PaymentStatusLoading message="Loading receipt…" receipt />}
    >
      <ReceiptContent key={`${identity.authUserId}:${identity.generation}:${paymentId}`} />
    </Suspense>
  );
}
