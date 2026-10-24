import { useState } from "react";
import { Share, Text, View } from "react-native";
import { Button } from "heroui-native";
import { IconCheck, IconDownload, IconShare2 } from "@tabler/icons-react-native";

import {
  formatPesoDisplay,
  formatReceiptDate,
  landlordReceiptStatus,
  ledgerPeriodLabel,
  receiptShareText,
} from "@repo/utils";

import { formatReferenceId, methodLabel, type PaymentRecord } from "@/service/payments/paymentService";

type Step = "idle" | "confirm" | "decline";

const NOTE_COLOR = "#71717A";
const DANGER_TEXT = "#DC2626";

interface PaymentReceiptActionsProps {
  payment: PaymentRecord;
  /** A confirm or decline is being saved. */
  isBusy: boolean;
  /** The last failed confirm or decline, in words. */
  error: string | null;
  onConfirm: () => void;
  onDecline: () => void;
  /** Clears `error` when the landlord starts over. */
  onClearError: () => void;
  /** Saves the receipt to the photo library; "denied" when access was refused, "unavailable" when this build has no photo module. */
  onSavePhoto: () => Promise<"saved" | "denied" | "unavailable">;
}

// Under the receipt: a cash payment waiting for the landlord is declined or marked as
// paid here, through a second step that replaces the buttons (no dialog on top of the
// receipt). Every receipt can also be shared as text through the system share sheet.
export default function PaymentReceiptActions({
  payment,
  isBusy,
  error,
  onConfirm,
  onDecline,
  onClearError,
  onSavePhoto,
}: PaymentReceiptActionsProps) {
  const [step, setStep] = useState<Step>("idle");
  const [shareError, setShareError] = useState<string | null>(null);
  const [photo, setPhoto] = useState<"idle" | "saving" | "saved">("idle");
  const [photoError, setPhotoError] = useState<string | null>(null);
  const awaitingCash = payment.status === "pending" && payment.method === "cash";
  const amount = formatPesoDisplay(payment.amount ?? 0);
  const who = payment.tenant_name ?? "the tenant";

  const choose = (next: Step) => {
    onClearError();
    setStep(next);
  };

  const savePhoto = async () => {
    setPhotoError(null);
    setPhoto("saving");
    try {
      const result = await onSavePhoto();
      if (result !== "saved") {
        setPhoto("idle");
        setPhotoError(
          result === "denied"
            ? "Allow photo access in your phone's settings to save receipts."
            : "Saving photos isn't available in this version of the app yet. Update or reinstall the app, then try again.",
        );
        return;
      }
      setPhoto("saved");
    } catch (failure) {
      console.error("The receipt could not be saved to photos.", failure);
      setPhoto("idle");
      setPhotoError("The receipt couldn't be saved. Please try again.");
    }
  };

  const share = async () => {
    setShareError(null);
    const status = landlordReceiptStatus(payment.status);
    try {
      await Share.share({
        message: receiptShareText({
          title: status.title,
          amount,
          period:
            payment.billing_kind === "move_in"
              ? "Move-in payment"
              : ledgerPeriodLabel(payment.due_date ?? payment.period_start ?? payment.date),
          tenant: payment.tenant_name ?? "—",
          apartment: payment.apartment_name ?? "—",
          dateLabel: status.label === "Paid" ? "Paid on" : "Recorded on",
          date: formatReceiptDate(payment.date),
          method: methodLabel(payment.method),
          reference: formatReferenceId(payment.reference_id),
        }),
      });
    } catch {
      console.error("The receipt could not be shared.");
      setShareError("The receipt couldn't be shared. Please try again.");
    }
  };

  return (
    <View className="gap-3">
      {error ? (
        <Text accessibilityRole="alert" className="text-center text-sm font-inter" style={{ color: DANGER_TEXT }}>
          {error}
        </Text>
      ) : null}

      {awaitingCash && step === "idle" ? (
        <>
          <Text className="text-center text-xs font-inter" style={{ color: NOTE_COLOR }}>
            Paid in cash? Confirm once you have received the money.
          </Text>
          <View className="flex-row gap-3">
            <Button className="flex-1" variant="danger-soft" isDisabled={isBusy} onPress={() => choose("decline")}>
              <Button.Label>Decline</Button.Label>
            </Button>
            <Button className="flex-1" isDisabled={isBusy} onPress={() => choose("confirm")}>
              <Button.Label>Mark as paid</Button.Label>
            </Button>
          </View>
        </>
      ) : null}

      {awaitingCash && step !== "idle" ? (
        <View
          accessibilityLabel={step === "confirm" ? "Confirm cash payment" : "Decline cash payment"}
          className="gap-3 rounded-2xl p-3"
          style={{ backgroundColor: "#FAFAFA" }}
        >
          <Text className="text-center text-sm font-inter" style={{ color: "#3F3F46" }}>
            {step === "confirm"
              ? `Confirm you received ${amount} in cash from ${who}? They will be notified.`
              : `Decline this ${amount} cash payment? ${payment.tenant_name ?? "The tenant"} can submit another request.`}
          </Text>
          <View className="flex-row gap-3">
            <Button className="flex-1" variant="secondary" isDisabled={isBusy} onPress={() => choose("idle")}>
              <Button.Label>Back</Button.Label>
            </Button>
            {step === "confirm" ? (
              <Button className="flex-1" isDisabled={isBusy} onPress={onConfirm}>
                <Button.Label>{isBusy ? "Confirming…" : "Yes, I received it"}</Button.Label>
              </Button>
            ) : (
              <Button className="flex-1" variant="danger" isDisabled={isBusy} onPress={onDecline}>
                <Button.Label>{isBusy ? "Declining…" : "Yes, decline"}</Button.Label>
              </Button>
            )}
          </View>
        </View>
      ) : null}

      {!awaitingCash ? (
        <Text className="text-center text-xs font-inter" style={{ color: NOTE_COLOR }}>
          {payment.status === "pending"
            ? "Waiting for the payment provider to confirm this payment."
            : payment.status === "paid"
              ? "Thank you. This payment is recorded in your income."
              : "No money was recorded for this payment."}
        </Text>
      ) : null}

      <View className="flex-row gap-3">
        <Button className="flex-1" variant="ghost" isDisabled={isBusy || photo === "saving"} onPress={() => void savePhoto()}>
          {photo === "saved" ? <IconCheck size={16} color="#16A34A" /> : <IconDownload size={16} color="#376BF5" />}
          <Button.Label className="text-primary">{photo === "saving" ? "Saving…" : photo === "saved" ? "Saved" : "Save as photo"}</Button.Label>
        </Button>
        <Button className="flex-1" variant="ghost" isDisabled={isBusy} onPress={() => void share()}>
          <IconShare2 size={16} color="#376BF5" />
          <Button.Label className="text-primary">Share</Button.Label>
        </Button>
      </View>
      {photoError ? (
        <Text accessibilityRole="alert" className="text-center text-xs font-inter" style={{ color: DANGER_TEXT }}>
          {photoError}
        </Text>
      ) : null}
      {shareError ? (
        <Text accessibilityRole="alert" className="text-center text-xs font-inter" style={{ color: DANGER_TEXT }}>
          {shareError}
        </Text>
      ) : null}
    </View>
  );
}
