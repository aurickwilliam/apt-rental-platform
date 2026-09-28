"use client";
import { Button } from "@heroui/react";
import Image from "next/image";
import { useState } from "react";
import { createClient } from "@repo/supabase/browser";
import { useAuth } from "./AuthContext";
import { isPendingOnboarding } from "@repo/supabase";
import { PORTAL_COOKIE, preferredPortal } from "@/lib/portal-preference";

interface UserRolesProfile {
  mobile_number: string | null;
  roles: string[];
  account_status: string;
}

export default function ThirdPartySignIn() {
  const { role, type } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    // Sign-in is role-agnostic: send no explicit role so the callback and
    // post-login routing fall back to the user's held roles. Sign-up sends
    // the chosen tab role so set_onboarding_role can run for new accounts.
    const redirectTo =
      type === "sign-in"
        ? `${window.location.origin}/auth/callback?popup=true`
        : `${window.location.origin}/auth/callback?popup=true&role=${role}`;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
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
            .select("mobile_number, roles, account_status")
            .eq("user_id", session.user.id)
            .single();
          const profile = profileData as unknown as UserRolesProfile | null;

          if (profileError || !profile) {
            console.error("Could not load Google sign-in profile", profileError);
            setError("Could not load your profile. Please try again.");
            return;
          }

          if (profile.roles.includes("admin")) {
            window.location.href = "/admin/dashboard";
            return;
          }

          if (!profile.mobile_number) {
            if (profile.account_status !== "unverified") {
              setError("Profile setup is unavailable for this account.");
              return;
            }
            // Pending onboarding (placeholder tenant row, no role chosen yet)
            // from the sign-in entry: keep the session and send them to the
            // role picker on sign-up (welcome banner). set_onboarding_role
            // runs only after they pick a role there.
            if (type === "sign-in" && isPendingOnboarding(profile)) {
              window.location.href = "/sign-up?from=google-new";
              return;
            }
            window.location.href = `/complete-profile?role=${role}`;
            return;
          }

          // Sign-up entries request an explicit portal role: enforce it.
          if (type === "sign-up") {
            if (!profile.roles.includes(role)) {
              setError(`This account is not registered as a ${role}.`);
              await supabase.auth.signOut();
              return;
            }

            document.cookie = `${PORTAL_COOKIE}=${role}; Path=/; SameSite=Lax; Max-Age=2592000${location.protocol === "https:" ? "; Secure" : ""}`;
            window.location.href = role === "landlord"
              ? "/landlord/dashboard"
              : "/tenant/my-rental";
            return;
          }

          // Sign-in entries are role-agnostic: route by held roles,
          // respecting the last portal choice. Admin is handled above.
          const selected = document.cookie.split("; ").find((item) => item.startsWith(`${PORTAL_COOKIE}=`))?.split("=")[1] ?? null;
          const portal = preferredPortal(profile.roles, selected);
          if (!portal) {
            setError("No account profile was found. Please sign up first.");
            await supabase.auth.signOut();
            return;
          }

          document.cookie = `${PORTAL_COOKIE}=${portal}; Path=/; SameSite=Lax; Max-Age=2592000${location.protocol === "https:" ? "; Secure" : ""}`;
          window.location.href = portal === "landlord"
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
