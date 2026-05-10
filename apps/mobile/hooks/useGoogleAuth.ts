import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useState } from "react";
import { supabase } from "@repo/supabase";

export function useGoogleAuth() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUrl = async (url: string, userSide: "tenant" | "landlord") => {
    console.log("handleUrl called with:", url);

    try {
      const parsedUrl = new URL(url);
      const code = parsedUrl.searchParams.get("code");
      const state = parsedUrl.searchParams.get("state");

      console.log("oauth callback params:", { code, state });

      if (!code) {
        setError("Authentication failed. No code returned.");
        setLoading(false);
        return;
      }

      const { data, error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);

      console.log("exchangeError:", JSON.stringify(exchangeError));

      if (exchangeError || !data.session) {
        setError("Failed to establish session.");
        setLoading(false);
        return;
      }

      const userId = data.session.user.id;

      // Fetch profile
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("role, created_at")
        .eq("user_id", userId)
        .single();

      if (profileError || !profile) {
        setError("Could not load your profile.");
        setLoading(false);
        return;
      }

      let role = profile.role;

      const isNewUser =
        Date.now() - new Date(profile.created_at).getTime() < 10000;

      if (isNewUser && profile.role !== userSide) {
        await supabase
          .from("users")
          .update({ role: userSide })
          .eq("user_id", userId);
        role = userSide;
      }

      setLoading(false);

      router.replace(
        role === "landlord"
          ? "../(tabs)/(landlord)/dashboard"
          : "../(tabs)/(tenant)/rentals",
      );
    } catch (err) {
      console.error("handleUrl error:", err);
      setError("Unexpected error occurred.");
      setLoading(false);
    }
  };

  const signInWithGoogle = async (userSide: "tenant" | "landlord") => {
    setLoading(true);
    setError("");

    try {
      const redirectTo = Linking.createURL("auth/callback");
      console.log("Redirect URI:", redirectTo);

      // Set up deep-link listener BEFORE opening the browser
      let handled = false;
      const subscription = Linking.addEventListener("url", ({ url }) => {
        if (handled) return;
        handled = true;
        subscription.remove();
        handleUrl(url, userSide);
      });

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams: { prompt: "select_account" },
        },
      });

      if (oauthError || !data.url) {
        subscription.remove();
        setError("Failed to initiate Google sign-in. Please try again.");
        setLoading(false);
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectTo,
      );
      console.log("WebBrowser result:", result.type);

      if (result.type === "success") {
        if (!handled) {
          handled = true;
          subscription.remove();
          await handleUrl(result.url, userSide);
        }
      } else if (result.type === "cancel" || result.type === "dismiss") {
        // User cancelled the sign-in flow
        if (!handled) {
          handled = true;
          subscription.remove();
          setLoading(false);
        }
      } else {
        // Any other unexpected result
        if (!handled) {
          handled = true;
          subscription.remove();
          setError("Sign-in was not completed. Please try again.");
          setLoading(false);
        }
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Google sign-in error:", err);
      setLoading(false);
    }
  };

  return { signInWithGoogle, loading, error };
}
