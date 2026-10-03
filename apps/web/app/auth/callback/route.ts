import { NextResponse } from "next/server";
import { createClient } from "@repo/supabase/server";
import { isPendingOnboarding } from "@repo/supabase";
import { PORTAL_COOKIE } from "@/lib/portal-preference";

interface UserRolesProfile {
  mobile_number: string | null;
  roles: string[];
  account_status: string;
}

function safeNextPath(value: string | null): string {
  if (!value) return "/";
  // Internal paths only: never protocol-relative or absolute URLs.
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("://")) return "/";
  return value;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const appOrigin = getAppOrigin(request);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));
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
          return NextResponse.redirect(`${appOrigin}/sign-in?error=auth_callback_error`);
        }
        const isAdmin = profile.roles.includes("admin");
        profileRole = isAdmin ? "admin" : null;
        const isInitialGoogleOnboarding =
          isOAuth && !isAdmin && isPendingOnboarding(profile);

        // Pending new Google arrival with no explicit role: keep the session
        // and send them to the role picker on sign-up (welcome banner).
        // set_onboarding_role runs only after they pick a role there.
        if (isInitialGoogleOnboarding && !role) {
          return NextResponse.redirect(`${appOrigin}/sign-up?from=google-new`);
        }

        // Explicit role requested on an admin account: block. Roles are
        // never granted to admins.
        if (role && isAdmin) {
          await supabase.auth.signOut();
          return NextResponse.redirect(`${appOrigin}/sign-up?error=role_mismatch`);
        }

        // "Add role": authenticated Google session, explicit role requested
        // from sign-up, complete non-admin account missing that role. This
        // is the only place the grant runs — never from a client-side call.
        // (Replaces the old role_mismatch sign-out for the normal flow.)
        if (isOAuth && !isAdmin && role && profile.mobile_number && !profile.roles.includes(role)) {
          const { error: grantError } = await supabase.rpc("grant_user_role", { new_role: role });
          if (grantError) {
            console.error("Could not grant OAuth role", grantError);
            await supabase.auth.signOut();
            return NextResponse.redirect(`${appOrigin}/sign-up?error=grant_failed`);
          }
          // Defensive: the RPC requires a completed profile, so mobile is
          // present on success. Route an incomplete profile to onboarding.
          if (!profile.mobile_number) {
            return NextResponse.redirect(`${appOrigin}/complete-profile?role=${role}`);
          }
          selectedPortal = role;
          const granted = NextResponse.redirect(
            `${appOrigin}${role === "landlord" ? "/landlord/dashboard" : "/tenant/my-rental"}`,
          );
          granted.cookies.set(PORTAL_COOKIE, selectedPortal, {
            path: "/", sameSite: "lax", secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24 * 30,
          });
          return granted;
        }

        if (isInitialGoogleOnboarding && role && !profile.roles.includes(role)) {
          const { error: roleError } = await supabase.rpc("set_onboarding_role", { requested_role: role });
          if (roleError) {
            console.error("Could not set OAuth onboarding role", roleError);
            await supabase.auth.signOut();
            return NextResponse.redirect(
              `${appOrigin}/sign-in?error=auth_callback_error`,
            );
          }
          profileRole = role;
        }

        if (!isAdmin && role && (profile.roles.includes(role) || isInitialGoogleOnboarding)) {
          selectedPortal = role;
        }

        if (isInitialGoogleOnboarding) {
          return NextResponse.redirect(
            `${appOrigin}/complete-profile${profileRole ? `?role=${profileRole}` : ""}`,
          );
        }
      }

      if (profileRole === "admin") {
        return NextResponse.redirect(`${appOrigin}/admin/dashboard`);
      }

      const destination = `${appOrigin}${next}`;
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

  return NextResponse.redirect(`${appOrigin}/sign-in?error=auth_callback_error`);
}
