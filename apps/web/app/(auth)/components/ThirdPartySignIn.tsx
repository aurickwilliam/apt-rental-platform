"use client";
import { Button } from "@heroui/react";
import Image from "next/image";
import { useState } from "react";
import { createClient } from "@repo/supabase/browser";
import { useAuth } from "./AuthContext";

export default function ThirdPartySignIn() {
  const { role, type } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    // Same-tab OAuth: the callback route owns all post-login routing.
    // Sign-in sends no explicit role (role-agnostic); sign-up sends the
    // chosen tab role so onboarding/grant can run for that portal.
    // window.location.origin keeps localhost in dev and the Vercel domain
    // in production with no hardcoded URL. Preserve ?next= so the callback
    // can return the user to their intended destination.
    const callbackParams = new URLSearchParams();
    if (type !== "sign-in") callbackParams.set("role", role);
    const requestedNext = new URLSearchParams(window.location.search).get("next");
    if (requestedNext && requestedNext.startsWith("/") && !requestedNext.startsWith("//")) {
      callbackParams.set("next", requestedNext);
    }
    const callbackQuery = callbackParams.toString();
    const redirectTo = `${window.location.origin}/auth/callback${callbackQuery ? `?${callbackQuery}` : ""}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

    if (error) {
      setError(error?.message ?? "Something went wrong.");
      setLoading(false);
      return;
    }
    // Otherwise the browser leaves for Google; the button stays in its
    // loading/disabled state while redirecting.
  };

  return (
    <div className="flex flex-col items-center gap-3 mt-5">
      {error && (
        <div className="w-full p-3 bg-danger-50 border border-danger-200 rounded-lg">
          <p className="text-sm text-danger text-center">{error}</p>
        </div>
      )}
      <Button
        variant="outline"
        className="w-full h-11 border border-default-300 bg-card font-medium"
        isPending={loading}
        isDisabled={loading}
        onPress={handleGoogleSignIn}
      >
        {!loading && (
          <Image
            src="/third-party/google-logo.svg"
            alt="Google"
            width={20}
            height={20}
          />
        )}
        Sign {type === "sign-in" ? "in" : "up"} with Google
      </Button>
    </div>
  );
}
