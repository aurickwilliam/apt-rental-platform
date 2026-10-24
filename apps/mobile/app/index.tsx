import { View } from "react-native";
import { useEffect } from "react";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { COLORS } from "@repo/constants";
import { supabase } from "@repo/supabase";
import { useTheme } from "hooks/useTheme";
import { usePortalStore } from "@/stores/usePortalStore";
import { portalHome } from "@/service/auth/portalPreference";
import { abandonUnfinishedPasswordRecovery } from "@/service/auth/passwordRecoveryService";
import { getCurrentUser } from "@/service/auth/currentUserService";
import { isProfileMissing, profileMissingRoute } from "@/service/auth/profileMissingService";
import { CURRENT_USER_QUERY_KEY, queryClient } from "@/utils/queryClient";
import { prepareTenantHome } from "@/hooks/tenancy";

export default function Index() {
  const { isDark } = useTheme();

  useEffect(() => {
    const checkOnboarding = async () => {
      const hasLaunched = await AsyncStorage.getItem("hasLaunched");
      if (hasLaunched === null) {
        await AsyncStorage.setItem("hasLaunched", "true");
        router.replace("/onboarding");
        return true; // signal to skip auth check
      }
      return false;
    };

    const redirectByRole = async (userId: string, email: string | undefined) => {
      // Loads the full profile into the shared cache, so the portal layout
      // doesn't fetch it a second time before showing the home tab.
      let userProfile;
      try {
        userProfile = await queryClient.fetchQuery({
          queryKey: CURRENT_USER_QUERY_KEY,
          queryFn: getCurrentUser,
        });
      } catch (error) {
        // Session restored, but the profile was never saved (the app closed
        // between the email code and the profile write): finish it.
        if (await isProfileMissing(userId)) {
          queryClient.removeQueries({ queryKey: CURRENT_USER_QUERY_KEY });
          router.replace(profileMissingRoute(email));
          return;
        }
        throw error;
      }

      if (!userProfile) throw new Error("Profile not found.");
      const portal = await usePortalStore.getState().restore(userId, userProfile.roles ?? []);
      if (portal === "tenant") {
        // Start the Rentals data now and load its skeleton hint while the
        // splash is still up.
        await prepareTenantHome(queryClient, userId, userProfile.id);
      }
      if (portal) {
        router.replace(portalHome(portal));
      } else {
        await supabase.auth.signOut();
        router.replace("/sign-in");
      }
    };

    // Listen to auth state — fires once session is restored from storage
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          const wentToOnboarding = await checkOnboarding();
          if (wentToOnboarding) {
            return;
          }

          // A password reset left unfinished must never restore into a portal.
          if (await abandonUnfinishedPasswordRecovery()) {
            router.replace("/sign-in");
            return;
          }

          if (!session) {
            router.replace("/sign-in");
          } else {
            await redirectByRole(session.user.id, session.user.email);
          }
        } catch (error) {
          console.error("Error during app boot:", error);
          usePortalStore.getState().reset();
          router.replace("/sign-in");
        } finally {
          subscription.unsubscribe();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Splash-colored backdrop while the boot redirect runs — no spinner, so
  // the splash-to-home transition is seamless (also covers JS reloads, where
  // the native splash does not re-appear). Matches the native splash
  // background per mode (light: brand blue, dark: near-black).
  const backgroundColor = isDark ? COLORS.dark.white : COLORS.light.primary;
  return <View style={{ flex: 1, backgroundColor }} />;
}
