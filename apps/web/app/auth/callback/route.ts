import { NextResponse } from "next/server";
import { createClient } from "@repo/supabase/server";
import { PORTAL_COOKIE } from "@/lib/portal-preference";

interface UserRolesProfile {
  mobile_number: string | null;
  roles: string[];
  account_status: string;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const isPopup = searchParams.get("popup") === "true";
  const requestedRole = searchParams.get("role");

  const role =
    requestedRole === "landlord" || requestedRole === "tenant"
      ? requestedRole
      : null;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const isOAuth = user?.app_metadata?.provider === "google";
      let profileRole: string | null = null;
      let selectedPortal: "tenant" | "landlord" | null = null;

      if (user) {
        const { data: profileData, error: profileError } = await supabase
          .from("users")
          .select("mobile_number, roles, account_status")
          .eq("user_id", user.id)
          .single();
        const profile = profileData as unknown as UserRolesProfile | null;
        if (profileError || !profile) {
          console.error("Could not load OAuth profile", profileError);
          await supabase.auth.signOut();
          return NextResponse.redirect(`${origin}/sign-in?error=auth_callback_error`);
        }
        const isAdmin = profile.roles.includes("admin");
        profileRole = isAdmin ? "admin" : null;
        const isInitialGoogleOnboarding =
          isOAuth &&
          !isAdmin &&
          !profile.mobile_number &&
          profile.account_status === "unverified";

        // Brand-new Google arrival with no explicit role (sign-in entry,
        // non-popup): do not default to a tenant form. Sign out so the
        // sign-up page stays reachable, then let them choose a role there
        // (welcome banner). set_onboarding_role runs only after that choice.
        if (!isPopup && isInitialGoogleOnboarding && !role) {
          await supabase.auth.signOut();
          return NextResponse.redirect(`${origin}/sign-up?from=google-new`);
        }

        if (!isAdmin && role && profile.mobile_number && !profile.roles.includes(role)) {
          await supabase.auth.signOut();
          return NextResponse.redirect(`${origin}/sign-in?error=role_mismatch`);
        }

        if (isInitialGoogleOnboarding && role && !profile.roles.includes(role)) {
          const { error: roleError } = await supabase.rpc("set_onboarding_role", { requested_role: role });
          if (roleError) {
            console.error("Could not set OAuth onboarding role", roleError);
            await supabase.auth.signOut();
            return NextResponse.redirect(
              `${origin}/sign-in?error=auth_callback_error`,
            );
          }
          profileRole = role;
        }

        if (!isAdmin && role && (profile.roles.includes(role) || isInitialGoogleOnboarding)) {
          selectedPortal = role;
        }

        if (!isPopup && isInitialGoogleOnboarding) {
          return NextResponse.redirect(
            `${origin}/complete-profile${profileRole ? `?role=${profileRole}` : ""}`,
          );
        }
      }

      if (isPopup) {
        return new NextResponse(
          `<html><body><script>window.close();</script></body></html>`,
          { headers: { "Content-Type": "text/html" } },
        );
      }

      if (profileRole === "admin") {
        return NextResponse.redirect(`${origin}/admin/dashboard`);
      }

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      const destination = isLocalEnv || !forwardedHost
        ? `${origin}${next}`
        : `https://${forwardedHost}${next}`;
      const response = NextResponse.redirect(destination);
      if (selectedPortal) {
        response.cookies.set(PORTAL_COOKIE, selectedPortal, {
          path: "/", sameSite: "lax", secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 60 * 24 * 30,
        });
      }
      return response;
    }
  }

  return NextResponse.redirect(`${origin}/sign-in?error=auth_callback_error`);
}
