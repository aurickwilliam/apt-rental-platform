import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useRouter } from "expo-router";

import { supabase } from "@repo/supabase";
import { getMySuspensionStatus } from "@/service/auth/suspensionService";
import { useSuspensionStore } from "@/stores/useSuspensionStore";
import { clearQueryClient } from "@/utils/queryClient";

// Signs out a device whose account was suspended while it was signed in, and
// leaves a notice for the sign-in screen. Checked on launch and on foreground.
export function useSuspensionGuard() {
  const router = useRouter();
  const checking = useRef(false);

  useEffect(() => {
    const check = async () => {
      if (checking.current) return;
      checking.current = true;
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) return;

        const status = await getMySuspensionStatus();
        if (!status.suspended) return;

        useSuspensionStore.getState().show(status.reason);
        await supabase.auth.signOut();
        clearQueryClient();
        router.replace("/(auth)/sign-in");
      } catch (error) {
        console.error("Suspension check failed", error);
      } finally {
        checking.current = false;
      }
    };

    void check();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void check();
    });
    return () => subscription.remove();
  }, [router]);
}
