import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useState } from "react";
import { supabase } from "@repo/supabase";

export function useGoogleAuth() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const signInWithGoogle = async (userSide: "tenant" | "landlord") => {
    setLoading(true);
    setError("");

    try {
      const redirectTo = Linking.createURL("/auth/callback");

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (oauthError || !data.url) {
        setError("Failed to initiate Google sign-in. Please try again.");
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectTo,
      );

      if (result.type === "success") {
        const url = result.url;
        const fragment = url.split("#")[1] ?? url.split("?")[1];
        const params = new URLSearchParams(fragment);
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (!accessToken) {
          setError("Authentication failed. Please try again.");
          return;
        }

        const { data: sessionData, error: sessionError } =
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken!,
          });

        if (sessionError || !sessionData.session) {
          setError("Failed to establish session. Please try again.");
          return;
        }

        const userId = sessionData.session.user.id;

        const { data: profile } = await supabase
          .from("users")
          .select("role, created_at")
          .eq("user_id", userId)
          .single();

        let role: string;

        const isNewUser =
          profile &&
          Date.now() - new Date(profile.created_at).getTime() < 10000;
        
        // If it's a new user and their role doesn't match the portal they signed in from, update it
        if (isNewUser && profile.role !== userSide) {
          await supabase
            .from("users")
            .update({ role: userSide })
            .eq("user_id", userId);

          role = userSide;
        } else {
          role = profile?.role ?? userSide;
        }

        router.replace(
          role === "landlord"
            ? "../(tabs)/(landlord)/dashboard"
            : "../(tabs)/(tenant)/home",
        );
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Google sign-in error:", err);
    } finally {
      setLoading(false);
    }
  };

  return { signInWithGoogle, loading, error };
}
