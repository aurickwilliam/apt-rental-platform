import { useState } from "react";
import { useNavigation, useRouter } from "expo-router";
import { usePreventRemove } from "@react-navigation/native";

import { supabase } from "@repo/supabase";
import { getProfileSubmitError } from "@repo/utils";

import { finishProfile } from "@/service/auth/finishProfileService";
import type { Portal } from "@/service/auth/portalPreference";
import { usePortalStore } from "@/stores/usePortalStore";
import { clearQueryClient } from "@/utils/queryClient";

import type { ProfileDetailsForm } from "./useProfileDetailsForm";

interface UseFinishProfileOptions {
  form: ProfileDetailsForm;
  role: Portal;
  requestedRole: string | undefined;
}

// Submit flow of the finish-profile screen: save the profile of the signed-in
// account, activate the chosen portal and go to its first screen. The screen
// blocks back navigation until the profile is saved or the user signs out.
export function useFinishProfile({ form, role, requestedRole }: UseFinishProfileOptions) {
  const router = useRouter();
  const navigation = useNavigation();

  const [canLeave, setCanLeave] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);

  usePreventRemove(!canLeave, ({ data }) => {
    if (canLeave) {
      navigation.dispatch(data.action);
    }
  });

  const submit = async () => {
    if (!form.validate()) return;

    setLoading(true);

    try {
      const userId = await finishProfile({ details: form.toRow(), role, requestedRole });
      await usePortalStore.getState().switchTo(userId, [role], role);

      setCanLeave(true);
      router.replace(
        role === "landlord"
          ? "../(tabs)/(landlord)/dashboard"
          : "/personalization/step-one",
      );
    } catch (err) {
      setError(getProfileSubmitError(err));
      setErrorDialogOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // An account that cannot finish here (wrong account, changed mind) needs an
  // explicit way out, since back is blocked.
  const signOut = async () => {
    clearQueryClient();
    await supabase.auth.signOut();
    setCanLeave(true);
    router.replace("/sign-in");
  };

  return {
    submit,
    signOut,
    loading,
    error,
    errorDialogOpen,
    closeErrorDialog: () => setErrorDialogOpen(false),
  };
}
