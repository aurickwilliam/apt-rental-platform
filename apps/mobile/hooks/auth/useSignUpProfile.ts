import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";

import type { usePasswordValidation } from "@repo/hooks";
import { CAPTCHA_FAILED_MESSAGE, CAPTCHA_PENDING_MESSAGE, emailCodeRequestErrorMessage, getEmailCodeRequestError, isCaptchaError, joinFullName } from "@repo/utils";

import { useTranslation } from "@/hooks/i18n";
import { requestSignUpCode } from "@/service/auth/signUpService";
import type { Portal } from "@/service/auth/portalPreference";
import { useRegistrationStore } from "@/stores/useRegistrationStore";

import type { ProfileDetailsForm } from "./useProfileDetailsForm";
import { useRegistrationAcceptance } from "./useRegistrationAcceptance";

interface UseSignUpProfileOptions {
  form: ProfileDetailsForm;
  passwords: ReturnType<typeof usePasswordValidation>;
  email: string;
  userSide: Portal;
  takeCaptcha?: () => { token?: string; pending: boolean };
}

// Submit flow of the sign-up profile screen: create the Auth account (which
// sends the confirmation code), keep the details in the registration store
// and continue to code verification, where the profile row is written.
export function useSignUpProfile({ form, passwords, email, userSide, takeCaptcha }: UseSignUpProfileOptions) {
  const router = useRouter();
  const { language } = useTranslation();
  const { setData, reset } = useRegistrationStore();
  const policies = useRegistrationAcceptance();
  const pending = useRef(false);
  const generation = useRef(0);
  useEffect(() => () => { generation.current += 1; }, []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);

  const submit = async () => {
    if (pending.current) return;
    if (!policies.validate()) return;
    if (!form.validate(passwords.isPasswordValid ? [] : ["password"])) return;

    const captcha = takeCaptcha?.();
    if (captcha?.pending) {
      setError(CAPTCHA_PENDING_MESSAGE);
      setErrorDialogOpen(true);
      return;
    }

    pending.current = true;
    const requestGeneration = generation.current;
    setLoading(true);

    try {
      await requestSignUpCode({
        email,
        acceptance: policies.value,
        password: passwords.password,
        captchaToken: captcha?.token,
        fullName: joinFullName({
          firstName: form.values.firstName,
          lastName: form.values.lastName,
          suffix: form.values.suffixName,
        }),
      });

      if (requestGeneration !== generation.current) return;
      setData({
        ...form.values,
        email,
        postalCode: form.postalCode,
        password: passwords.password,
        mobileNumber: form.mobileNumber,
        userSide,
        acceptance: { ...policies.value },
        profileDetails: form.toRow(),
      });

      router.push({ pathname: "/(auth)/otp-verification", params: { email } });
    } catch (err) {
      if (requestGeneration !== generation.current) return;
      if (policies.handleError(err)) return;
      setError(
        isCaptchaError(err)
          ? CAPTCHA_FAILED_MESSAGE
          : emailCodeRequestErrorMessage(language, err instanceof Error ? err.message : undefined),
      );
      setErrorDialogOpen(true);
    } finally {
      pending.current = false;
      if (requestGeneration === generation.current) setLoading(false);
    }
  };

  const goBack = () => {
    generation.current += 1;
    reset();
    router.back();
  };

  return {
    policies,
    submit,
    goBack,
    loading,
    error,
    errorDialogOpen,
    closeErrorDialog: () => setErrorDialogOpen(false),
  };
}
