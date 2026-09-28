"use client";
import { Button } from "@heroui/react";
import Image from "next/image";
import { useState } from "react";
import { createClient } from "@repo/supabase/browser";
import { useAuth } from "./AuthContext";
import { PORTAL_COOKIE } from "@/lib/portal-preference";

interface UserRolesProfile { mobile_number: string | null; roles: string[] }

export default function ThirdPartySignIn() {
  const { role, type } = useAuth();
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
          const { data: profileData, error: profileError } = await supabase
            .from("users")
            .select("mobile_number, roles")
            .eq("user_id", session.user.id)
            .single();
          const profile = profileData as unknown as UserRolesProfile | null;

          if (profileError || !profile) {
            console.error("Could not load Google sign-in profile", profileError);
            setError("Could not load your profile. Please try again.");
            return;
          }

          if (profile?.roles.includes("admin")) {
            window.location.href = "/admin/dashboard";
            return;
          }

          if (!profile.mobile_number) {
            window.location.href = `/complete-profile?role=${role}`;
            return;
          }

          if (!profile.roles.includes(role)) {
            setError(`This account is not registered as a ${role}.`);
            await supabase.auth.signOut();
            return;
          }

          document.cookie = `${PORTAL_COOKIE}=${role}; Path=/; SameSite=Lax; Max-Age=2592000${location.protocol === "https:" ? "; Secure" : ""}`;
          window.location.href = role === "landlord"
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
        variant="outline"
        className="w-full h-11 border border-default-300 bg-white font-medium"
        isPending={loading}
        onPress={handleGoogleSignIn}
      >
        {
          !loading && (
            <Image src="/third-party/google-logo.svg" alt="Google" width={20} height={20} />
          )
        }
        Sign {type === 'sign-in' ? 'in' : 'up'} with Google
      </Button>
    </div>
  );
}
