import { useRef, useState } from "react";
import {
  normalizePaymentMethodPreferences,
  togglePreferredPaymentMethod,
  describeAuthError,
  type PaymentMethod,
  type PaymentMethodPreference,
} from "@repo/utils";

export function usePaymentPreferencesForm(
  initial: PaymentMethodPreference,
  onSave: (preferences: PaymentMethodPreference) => Promise<PaymentMethodPreference>,
) {
  // Seed once per account/page visit. Background reads must not overwrite a draft.
  const [draft, setDraft] = useState(() => normalizePaymentMethodPreferences(initial));
  const [baseline, setBaseline] = useState(() => normalizePaymentMethodPreferences(initial));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline);

  const toggleMethod = (method: PaymentMethod) => {
    if (busy.current) return;
    setDraft((previous) => togglePreferredPaymentMethod(previous, method));
    setError(null);
  };
  const setDefault = (method: PaymentMethod) => {
    if (busy.current) return;
    setDraft((previous) => previous.savedMethods.includes(method) ? { ...previous, defaultMethod: method } : previous);
    setError(null);
  };
  const submit = async () => {
    if (busy.current || !dirty) return false;
    busy.current = true;
    setIsSubmitting(true);
    setError(null);
    try {
      const saved = await onSave(draft);
      setDraft(saved);
      setBaseline(saved);
      return true;
    } catch (failure) {
      console.error("Saving payment preferences failed", describeAuthError(failure));
      setError("Couldn't save your payment preferences. Please try again.");
      return false;
    } finally {
      busy.current = false;
      setIsSubmitting(false);
    }
  };
  return { draft, dirty, isSubmitting, error, toggleMethod, setDefault, submit };
}
