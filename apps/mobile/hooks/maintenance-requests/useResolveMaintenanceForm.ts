import { useRef, useState } from "react";
import { Keyboard } from "react-native";
import { getMaintenanceFeeError, describeAuthError } from "@repo/utils";

interface ResolveMaintenanceFormOptions {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (notes: string, feeAmount?: number) => Promise<boolean> | boolean;
}

export function useResolveMaintenanceForm({ isOpen, onOpenChange, onConfirm }: ResolveMaintenanceFormOptions) {
  const [wasOpen, setWasOpen] = useState(isOpen);
  const [notes, setNotes] = useState("");
  const [chargeFee, setChargeFee] = useState(false);
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const busy = useRef(false);

  if (wasOpen !== isOpen) {
    setWasOpen(isOpen);
    setNotes("");
    setChargeFee(false);
    setAmount("");
    setStep("form");
    setSubmitted(false);
    setSubmitError(null);
  }

  const feeAmount = chargeFee ? (amount.trim() ? Number(amount) : NaN) : undefined;
  const notesError = submitted && !notes.trim() ? "Please enter resolution notes." : null;
  const feeError = submitted ? getMaintenanceFeeError(feeAmount) : null;

  const close = (open: boolean) => {
    if (!busy.current) onOpenChange(open);
  };

  const submit = async () => {
    if (busy.current) return;
    setSubmitted(true);
    setSubmitError(null);
    if (!notes.trim() || getMaintenanceFeeError(feeAmount)) return;
    Keyboard.dismiss();
    if (chargeFee && step === "form") {
      setStep("confirm");
      return;
    }
    busy.current = true;
    setIsSubmitting(true);
    try {
      if (await onConfirm(notes.trim(), feeAmount)) {
        onOpenChange(false);
      } else {
        setSubmitError("Could not resolve this request. Please try again.");
      }
    } catch (error) {
      console.error("Resolve maintenance request failed", describeAuthError(error));
      setSubmitError("Could not resolve this request. Please try again.");
    } finally {
      busy.current = false;
      setIsSubmitting(false);
    }
  };

  return {
    notes, setNotes, chargeFee, setChargeFee, amount, setAmount, step, setStep,
    notesError, feeError, feeAmount, isSubmitting, submitError, close, submit,
  };
}
