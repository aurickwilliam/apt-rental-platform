"use client";
import { Button } from "@heroui/react";
import Image from "next/image";
import { useState } from "react";
import { createClient } from "@repo/supabase/browser";
import { useAuth } from "./AuthContext";

export default function ThirdPartySignIn() {
  const { role } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?popup=true&role=${role}`,
        skipBrowserRedirect: true,
      },
    });

    if (error || !data.url) {
      setError(error?.message ?? "Something went wrong.");
      setLoading(false);
      return;
    }

    // Open as popup
    const popup = window.open(
      data.url,
      "Google Sign In",
      "width=500,height=600,scrollbars=yes,resizable=yes",
    );

    // Poll until popup closes, then refresh session
    const timer = setInterval(async () => {
      if (popup?.closed) {
        clearInterval(timer);
        setLoading(false);

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          // Check if profile is complete
          const { data: profile } = await supabase
            .from("users")
            .select("mobile_number, role")
            .eq("user_id", session.user.id)
            .single();

          if (!profile?.mobile_number) {
            window.location.href = `/complete-profile?role=${role}`;
            return;
          }

          window.location.href =
            profile.role === "landlord"
              ? "/landlord/dashboard"
              : "/tenant/my-rental";
        }
      }
    }, 500);
  };

  return (
    <div className="flex flex-col items-center gap-3 mt-5">
      {error && (
        <div className="w-full p-3 bg-danger-50 border border-danger-200 rounded-lg">
          <p className="text-sm text-danger text-center">{error}</p>
        </div>
      )}
      <Button
        variant="flat"
        isIconOnly
        radius="full"
        className="size-12 p-1 bg-darker-white"
        isLoading={loading}
        onPress={handleGoogleSignIn}
      >
        {!loading && (
          <Image
            src="/third-party/google-logo.svg"
            alt="Google"
            width={45}
            height={45}
          />
        )}
      </Button>
    </div>
  );
}
