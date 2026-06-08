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
    try {
      // Google returns a one-time code in the redirect URL
      const parsedUrl = new URL(url);
      const code = parsedUrl.searchParams.get("code");
      
      // Show error, if there is no code in the URL
      // This means the authentication failed or was cancelled before completion
      if (!code) {
        setError("Authentication failed. No code returned.");
        setLoading(false);
        return;
      }
      
      // Exchange the code for a session and log the user in
      // Supabase exchanges that code for an actual session (access token + refresh token)
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      // Show error if the code exchange fails for any reason
      if (exchangeError || !data.session) {
        setError("Failed to establish session.");
        setLoading(false);
        return;
      }

      // Fetch profile to check role and account creation time
      const userId = data.session.user.id;
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("role, created_at, mobile_number")
        .eq("user_id", userId)
        .single();

      // Show error if we can't load the user's profile for any reason 
      if (profileError || !profile) {
        setError("Could not load your profile.");
        setLoading(false);
        return;
      }

      // Set role
      let role = profile.role;

      // Check if this is a new user
      const isNewUser = Date.now() - new Date(profile.created_at).getTime() < 10000;

      // If it's a new user and their role doesn't match the portal they signed in from,
      // update the DB to reflect the correct role
      if (isNewUser && profile.role !== userSide) {
        await supabase
          .from("users")
          .update({ role: userSide })
          .eq("user_id", userId);

        role = userSide;
      }

      setLoading(false);

      // If the profile is incomplete, redirect to complete profile page first
      const isProfileComplete = !!profile.mobile_number;

      if (!isProfileComplete) {
        router.replace("../(auth)/auth-complete-profile");
        return;
      }

      // Route the user based on their role
      router.replace(
        role === "landlord"
          ? "../(tabs)/(landlord)/dashboard"
          : "../(tabs)/(tenant)/rentals",
      );

    } catch (err) {
      setError("Unexpected error occurred.");
      setLoading(false);

      console.error("handleUrl error:", err);
    }
  };

  const signInWithGoogle = async (userSide: "tenant" | "landlord") => {
    setLoading(true);
    setError("");

    try {
      // This creates a deep link URL specific to the app
      // This is where Google will redirect the user after they authenticate.
      const redirectTo = Linking.createURL("auth/callback");

      // Set up deep-link listener BEFORE opening the browser
      // If it receives a URL, it will call handleUrl
      let handled = false;
      const subscription = Linking.addEventListener("url", ({ url }) => {
        if (handled) return;

        handled = true;
        subscription.remove();
        handleUrl(url, userSide);
      });

      // Start the OAuth flow by getting the URL to open from Supabase
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams: { prompt: "select_account" },
        },
      });

      // If there's an error or no URL, clean up the listener and show an error
      if (oauthError || !data.url) {
        subscription.remove();
        setError("Failed to initiate Google sign-in. Please try again.");
        setLoading(false);
        return;
      }

      // Open the URL in the browser
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectTo,
      );

      // Check the result of the browser session
      if (result.type === "success") {
        // If the user successfully authenticated and we got a URL back,
        // handle it and call handleUrl to exchange the code for a session and log them in.
        if (!handled) {
          handled = true;
          subscription.remove();
          await handleUrl(result.url, userSide);
        }

      } else if (result.type === "cancel" || result.type === "dismiss") {
        // User cancelled the sign-in flow
        // Clean up the listener and reset loading state
        if (!handled) {
          handled = true;
          subscription.remove();

          setLoading(false);
        }

      } else {
        // Any other unexpected result
        // Clean up the listener and show an error
        if (!handled) {
          handled = true;
          subscription.remove();

          setError("Sign-in was not completed. Please try again.");
          setLoading(false);
        }
      }

    } catch (err) {
      // Handle any unexpected errors during the sign-in process
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);

      console.error("signInWithGoogle error:", err);
    }
  };

  const resetError = () => setError("");

  return { 
    signInWithGoogle, 
    loading, 
    error,
    resetError,
  };
}
