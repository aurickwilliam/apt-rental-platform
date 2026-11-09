"use client";

import type { ReactNode } from "react";
import { Button } from "@heroui/react";

import { useTranslation } from "@/app/components/i18n/LocaleProvider";

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
  continueLabel,
  isBackDisabled = false,
  isContinueDisabled = false,
  isContinuePending = false,
}: FormStepActionsProps) {
  const { t } = useTranslation();
  const continueContent = continueLabel ?? t("common.continue");
  return (
    <div className="form-step-actions mt-10 flex justify-between gap-4 border-t border-border pt-6">
      <Button
        variant={isFirstStep ? "danger-soft" : "tertiary"}
        className="cursor-pointer"
        onPress={onBack}
        isDisabled={isBackDisabled}
      >
        {isFirstStep ? t("common.cancel") : t("common.back")}
      </Button>
      <Button className="cursor-pointer" onPress={onContinue} isPending={isContinuePending} isDisabled={isContinueDisabled}>
        {continueContent}
      </Button>
    </div>
  );
}
