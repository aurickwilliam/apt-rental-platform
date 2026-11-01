"use client";

import { Button } from "@heroui/react";

interface MobileVerificationNavigationProps {
  onBack?: () => void;
  onContinue?: () => void;
  label?: string;
  isDisabled?: boolean;
  isPending?: boolean;
}

export default function MobileVerificationNavigation({ onBack, onContinue, label = "Continue", isDisabled = false, isPending = false }: MobileVerificationNavigationProps) {
  return (
    <div className="mobile-verification-navigation" role="group" aria-label="Verification navigation">
      {onBack ? <Button type="button" variant="outline" onPress={onBack} isDisabled={isPending}>Back</Button> : null}
      {onContinue ? <Button type="button" variant="primary" onPress={onContinue} isDisabled={isDisabled || isPending} isPending={isPending}>{label}</Button> : null}
    </div>
  );
}
