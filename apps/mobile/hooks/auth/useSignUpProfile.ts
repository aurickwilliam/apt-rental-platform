import { useState } from "react";
import { useRouter } from "expo-router";

import type { usePasswordValidation } from "@repo/hooks";
import { getEmailCodeRequestError, joinFullName } from "@repo/utils";

import { requestSignUpCode } from "@/service/auth/signUpService";
import type { Portal } from "@/service/auth/portalPreference";
import { useRegistrationStore } from "@/stores/useRegistrationStore";

import type { ProfileDetailsForm } from "./useProfileDetailsForm";

interface UseSignUpProfileOptions {
  form: ProfileDetailsForm;
  passwords: ReturnType<typeof usePasswordValidation>;
  email: string;
  userSide: Portal;
}

// Submit flow of the sign-up profile screen: create the Auth account (which
// sends the confirmation code), keep the details in the registration store
// and continue to code verification, where the profile row is written.
export function useSignUpProfile({ form, passwords, email, userSide }: UseSignUpProfileOptions) {
  const router = useRouter();
  const { setData, reset } = useRegistrationStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);

  const submit = async () => {
    if (!form.validate(passwords.isPasswordValid ? [] : ["password"])) return;

    setLoading(true);

    try {
      await requestSignUpCode({
        email,
        password: passwords.password,
        fullName: joinFullName({
          firstName: form.values.firstName,
          lastName: form.values.lastName,
          suffix: form.values.suffixName,
        }),
      });

      setData({
        ...form.values,
        email,
        postalCode: form.postalCode,
        password: passwords.password,
        mobileNumber: form.mobileNumber,
        userSide,
      });

      router.push({ pathname: "/(auth)/otp-verification", params: { email } });
    } catch (err) {
      setError(getEmailCodeRequestError(err instanceof Error ? err.message : undefined));
      setErrorDialogOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    reset();
    router.back();
  };

  return {
    submit,
    goBack,
    loading,
    error,
    errorDialogOpen,
    closeErrorDialog: () => setErrorDialogOpen(false),
  };
}
