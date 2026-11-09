"use client";

import type { ReactNode } from "react";
import { Button } from "@heroui/react";

interface FormStepActionsProps {
  /** The first step offers Cancel instead of Back. */
  isFirstStep: boolean;
  onBack: () => void;
  onContinue: () => void;
  continueLabel?: ReactNode;
  isBackDisabled?: boolean;
  isContinueDisabled?: boolean;
  isContinuePending?: boolean;
}

/** Bottom Back/Cancel and Continue row for multi-step web forms; pairs with `FormStepper`. */
export default function FormStepActions({
  isFirstStep,
  onBack,
  onContinue,
  continueLabel = "Continue",
  isBackDisabled = false,
  isContinueDisabled = false,
  isContinuePending = false,
}: FormStepActionsProps) {
  return (
    <div className="form-step-actions mt-10 flex justify-between gap-4 border-t border-border pt-6">
      <Button
        variant={isFirstStep ? "danger-soft" : "tertiary"}
        className="cursor-pointer"
        onPress={onBack}
        isDisabled={isBackDisabled}
      >
        {isFirstStep ? "Cancel" : "Back"}
      </Button>
      <Button className="cursor-pointer" onPress={onContinue} isPending={isContinuePending} isDisabled={isContinueDisabled}>
        {continueLabel}
      </Button>
    </div>
  );
}
