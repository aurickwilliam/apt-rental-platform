"use client";

import { useState } from "react";
import { Button, Checkbox, CheckboxGroup, Modal, Radio, RadioGroup, useOverlayState } from "@heroui/react";

import { PAYMENT_METHODS } from "../constants";
import type { PaymentMethod, PaymentMethodPreference } from "../types";

interface PaymentPreferencesModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  preferences: PaymentMethodPreference;
  isSaving: boolean;
  onSave: (preferences: PaymentMethodPreference) => Promise<void>;
}

export default function PaymentPreferencesModal({
  isOpen,
  onOpenChange,
  preferences,
  isSaving,
  onSave,
}: PaymentPreferencesModalProps) {
  const state = useOverlayState({ isOpen, onOpenChange });
  const sourceSignature = `${isOpen}:${JSON.stringify(preferences)}`;
  const [previousSourceSignature, setPreviousSourceSignature] = useState(sourceSignature);
  const [savedMethods, setSavedMethods] = useState<PaymentMethod[]>(preferences.savedMethods);
  const [defaultMethod, setDefaultMethod] = useState<PaymentMethod | null>(preferences.defaultMethod);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (previousSourceSignature !== sourceSignature) {
    setPreviousSourceSignature(sourceSignature);
    setSavedMethods(preferences.savedMethods);
    setDefaultMethod(preferences.defaultMethod);
    setIsSubmitting(false);
  }

  const handleSavedMethodsChange = (values: string[]) => {
    const next = values as PaymentMethod[];
    setSavedMethods(next);
    if (defaultMethod && !next.includes(defaultMethod)) {
      setDefaultMethod(next[0] ?? null);
    } else if (!defaultMethod && next.length > 0) {
      setDefaultMethod(next[0]);
    }
  };

  const handleSave = async () => {
    if (isSubmitting || isSaving) return;
    setIsSubmitting(true);
    try {
      await onSave({ savedMethods, defaultMethod: savedMethods.includes(defaultMethod as PaymentMethod) ? defaultMethod : null });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal.Root state={state}>
      <Modal.Backdrop isDismissable={!isSubmitting}>
        <Modal.Container placement="center" size="sm" scroll="inside">
          <Modal.Dialog className="rounded-2xl">
            <Modal.Header>
              <Modal.Heading className="font-nunito text-2xl font-bold text-foreground">Payment preferences</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="space-y-5">
              <p className="text-sm text-muted-foreground">
                Save payment types you use often and choose the default for rent checkout. APT never saves card details, wallet accounts, or security codes.
              </p>

              <section aria-labelledby="saved-methods-heading">
                <h3 id="saved-methods-heading" className="text-sm font-nunito font-semibold text-foreground">Saved methods</h3>
                <CheckboxGroup value={savedMethods} onChange={handleSavedMethodsChange} className="payment-preference-checks mt-3 gap-2">
                  {PAYMENT_METHODS.map((method) => (
                    <Checkbox key={method.key} value={method.key}>
                      <Checkbox.Content>
                        <Checkbox.Control>
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                        {method.label}
                      </Checkbox.Content>
                    </Checkbox>
                  ))}
                </CheckboxGroup>
              </section>

              {savedMethods.length > 0 && (
                <section aria-labelledby="default-method-heading" className="border-t border-border pt-5">
                  <h3 id="default-method-heading" className="text-sm font-nunito font-semibold text-foreground">Default method</h3>
                  <p className="mt-1 text-xs text-muted-foreground">You can still choose another method for any payment.</p>
                  <RadioGroup
                    aria-label="Default payment method"
                    value={defaultMethod ?? undefined}
                    onChange={(value) => setDefaultMethod(value as PaymentMethod)}
                    className="payment-method-radios mt-3 gap-2"
                  >
                    {savedMethods.map((method) => (
                      <Radio key={method} value={method}>
                        <Radio.Content>
                          <Radio.Control>
                            <Radio.Indicator />
                          </Radio.Control>
                          {method}
                        </Radio.Content>
                      </Radio>
                    ))}
                  </RadioGroup>
                </section>
              )}
            </Modal.Body>
            <Modal.Footer className="grid grid-cols-2 gap-3">
              <Button variant="ghost" onPress={state.close} isDisabled={isSubmitting} className="w-full">Cancel</Button>
              <Button onPress={() => void handleSave()} isPending={isSubmitting} isDisabled={isSaving} className="w-full">Save preferences</Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal.Root>
  );
}
