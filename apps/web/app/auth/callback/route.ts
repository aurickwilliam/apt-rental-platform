import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@repo/supabase/server";
import { isPendingOnboarding } from "@repo/supabase/pending-onboarding";
import { PORTAL_COOKIE, preferredPortal, portalDestination } from "@/lib/portal-preference";

interface UserRolesProfile {
  mobile_number: string | null;
  roles: string[];
  account_status: string;
}

function getAppOrigin(request: Request): string {
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  if (forwardedHost) {
    const proto =
      request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? "https";
    return `${proto}://${forwardedHost}`;
  }

  const host = request.headers.get("host");
  if (host) {
    const proto =
      request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ??
      (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
    return `${proto}://${host}`;
  }

  return new URL(request.url).origin;
}

function getSafeNext(searchParams: URLSearchParams): string {
  const raw = searchParams.get("next") ?? "/";
  // Internal paths only: never protocol-relative or absolute URLs.
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("://") || /[\\\u0000-\u0020\u007f]/.test(raw)) return "/";
  const url = new URL(raw, "https://apt.invalid");
  if (url.origin !== "https://apt.invalid") return "/";
  return `${url.pathname}${url.search}${url.hash}`;
}

// Lands in the chosen portal and remembers it (portal cookie).
function portalRedirect(appOrigin: string, portal: "tenant" | "landlord"): NextResponse {
  const response = NextResponse.redirect(
    `${appOrigin}${portal === "landlord" ? "/landlord/dashboard" : "/tenant/my-rental"}`,
  );
  response.cookies.set(PORTAL_COOKIE, portal, {
    path: "/", sameSite: "lax", secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const appOrigin = getAppOrigin(request);
  const code = searchParams.get("code");
  let next = getSafeNext(searchParams);
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
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        await supabase.auth.signOut();
        return NextResponse.redirect(`${appOrigin}/sign-in?error=auth_callback_error`);
      }
      const isOAuth = user?.app_metadata?.provider === "google";
      let profileRole: string | null = null;
      let selectedPortal: "tenant" | "landlord" | null = null;

      let defaultDestination: string | null = null;
      if (user) {
        // Suspended accounts authenticate but cannot read their profile (RLS).
        const { data: suspension } = await supabase.rpc("get_my_suspension_status");
        if ((suspension as { suspended?: boolean } | null)?.suspended) {
          return NextResponse.redirect(`${appOrigin}/suspended`);
        }

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
        const nextPortal = /^\/(tenant|landlord|admin)(?:\/|$)/.exec(new URL(next, appOrigin).pathname)?.[1];
        if (nextPortal && !profile.roles.includes(nextPortal)) next = "/";
        profileRole = isAdmin ? "admin" : null;
        const isInitialGoogleOnboarding =
          isOAuth && !isAdmin && isPendingOnboarding(profile);

        // Pending new Google arrival with no explicit role: keep the session
        // and send them to the role picker on sign-up (welcome banner).
        // set_onboarding_role runs only after they pick a role there.
        if (isInitialGoogleOnboarding && !role) {
          return NextResponse.redirect(`${appOrigin}/sign-up?from=google-new`);
        }

        // An admin who already holds the requested role goes straight to that
        // portal (the home page would send an admin to /admin/dashboard).
        if (isAdmin && role && profile.roles.includes(role)) {
          return portalRedirect(appOrigin, role);
        }

        // "Add role": authenticated Google session, explicit role requested
        // from sign-up, complete account (admins included: an admin who also
        // owns or rents needs the role on the same account) missing that
        // role. The grant RPC only ever adds tenant/landlord, never admin.
        if (isOAuth && role && profile.mobile_number && !profile.roles.includes(role)) {
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
          return portalRedirect(appOrigin, role);
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

        // Returning consumers should not visit the public homepage just to
        // select a portal. A role/cookie is a preference only, never a grant.
        if (!isAdmin) {
          selectedPortal = preferredPortal(
            profile.roles,
            selectedPortal ?? (await cookies()).get(PORTAL_COOKIE)?.value ?? null,
          );
        }
        defaultDestination = portalDestination(profile.roles, selectedPortal);
      }

      if (profileRole === "admin") {
        return NextResponse.redirect(`${appOrigin}/admin/dashboard`);
      }

      if (next === "/" && !defaultDestination) {
        await supabase.auth.signOut();
        return NextResponse.redirect(`${appOrigin}/sign-in?error=auth_callback_error`);
      }
      const destination = `${appOrigin}${next === "/" ? defaultDestination : next}`;
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
