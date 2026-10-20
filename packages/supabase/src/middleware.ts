import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./types";
import { isPendingOnboarding } from "./pending-onboarding";
import {
  isBackgroundRequest,
  isRecoveryPath,
  isSupabaseAuthCookie,
  readRecoveryMarker,
  RECOVERY_CACHE_CONTROL,
  RECOVERY_MARKER_COOKIE,
  recoveryRouteDecision,
} from "./password-recovery";

const ROLE_ROUTES: Record<string, string[]> = {
  tenant: ["/tenant"],
  landlord: ["/landlord"],
  admin: ["/admin"],
};

const PROTECTED_ROUTES = Object.values(ROLE_ROUTES).flat();

interface UserRolesProfile { roles: string[] }

function defaultRole(roles: string[]): string | undefined {
  return ["admin", "landlord", "tenant"].find((role) => roles.includes(role));
}

// Expires a cookie on the root path, where both the Auth cookies and the
// recovery marker live (a bare delete would target the request's path).
function expireCookie(response: NextResponse, name: string) {
  response.cookies.set(name, "", { path: "/", maxAge: 0 });
}

// A fresh redirect drops cookies written to the pass-through response (e.g.
// by signOut), so copy them over.
function redirectWithCookies(
  request: NextRequest,
  from: NextResponse,
  pathname: string,
): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  const response = NextResponse.redirect(url);
  from.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
  return response;
}

export async function updateSession(request: NextRequest) {
  if (request.headers.get("next-action") !== null) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      "Supabase URL or Anon Key is missing. Please check your environment variables.",
    );
    return supabaseResponse;
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[],
      ) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // IMPORTANT: Do NOT use supabase.auth.getSession() inside server code.
  // It reads from cookies which could be tampered with.
  // Use getUser() instead which validates the session with the Supabase Auth server.
  const {
    data: { user: fetchedUser },
    error: userError,
  } = await supabase.auth.getUser();
  const user = userError?.name === "AuthSessionMissingError" ? null : fetchedUser;
  if (userError && userError.name !== "AuthSessionMissingError") {
    console.warn("Failed to fetch user in middleware", userError);
  }

  const pathname = request.nextUrl.pathname;

  // Password recovery: a session created by a recovery code may only be used
  // on the reset page. Runs before every other rule so it never reaches a portal.
  const recovery = recoveryRouteDecision({
    marker: readRecoveryMarker(request.cookies.get(RECOVERY_MARKER_COOKIE)?.value, Date.now()),
    hasUser: user !== null,
    pathname,
    isBackgroundRequest: isBackgroundRequest((name) => request.headers.get(name)),
  });
  const hasRecoveryState =
    request.cookies.has(RECOVERY_MARKER_COOKIE) || isRecoveryPath(pathname);

  if (recovery.action === "no_content") {
    const response = new NextResponse(null, { status: 204 });
    response.headers.set("Cache-Control", RECOVERY_CACHE_CONTROL);
    return response;
  }

  if (recovery.action === "end_session") {
    const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });
    if (signOutError) {
      const { name, code, status } = signOutError as { name?: string; code?: string; status?: number };
      console.warn("Password recovery sign-out failed in middleware", { name, code, status });
    }
    const response = redirectWithCookies(request, supabaseResponse, recovery.to);
    // Backstop: signOut keeps the cookies when it cannot read the session.
    request.cookies.getAll().forEach(({ name }) => {
      if (isSupabaseAuthCookie(name)) expireCookie(response, name);
    });
    expireCookie(response, RECOVERY_MARKER_COOKIE);
    response.headers.set("Cache-Control", RECOVERY_CACHE_CONTROL);
    return response;
  }

  if (recovery.action === "redirect") {
    const response = redirectWithCookies(request, supabaseResponse, recovery.to);
    if (recovery.clearMarker) expireCookie(response, RECOVERY_MARKER_COOKIE);
    response.headers.set("Cache-Control", RECOVERY_CACHE_CONTROL);
    return response;
  }

  if (recovery.action === "clear_marker") {
    expireCookie(supabaseResponse, RECOVERY_MARKER_COOKIE);
  }

  if (hasRecoveryState) {
    supabaseResponse.headers.set("Cache-Control", RECOVERY_CACHE_CONTROL);
  }

  if (recovery.action === "allow") return supabaseResponse;

  // Pages that anyone can access without logging in
  const publicRoutes = [
    "/",
    "/browse",
    "/forowners",
    "/sign-in",
    "/sign-up",
    "/sign-up-form",
    "/forgot-password",
    "/auth/callback",
    "/suspended",
    "/about",
    "/community",
    "/company",
    "/careers",
    "/help",
    "/contact",
    "/safety",
    "/faq", 
    "/tos",
    "/pap",
    "/cookies",
    // Serves the landing page's Android APK link to signed-out visitors.
    "/download"
  ];

  // Pages that logged-in users should be redirected away from. An active
  // recovery session on the reset page returned above.
  const authRoutes = ["/sign-in", "/sign-up", "/sign-up-form", "/forgot-password"];

  const isPublicRoute = publicRoutes.some((route) =>
    route === "/" ? pathname === "/" : pathname.startsWith(route),
  );

  // If the user is not signed in and trying to access a non-public route,
  // redirect them to the sign-in page. Verification handoff pages preserve
  // the opaque session token via `next` so the phone returns to
  // /verify/mobile?token=... after login; other routes keep prior behavior.
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    if (pathname === "/verify" || pathname.startsWith("/verify/")) {
      const returnTo = `${pathname}${request.nextUrl.search}`;
      url.pathname = "/sign-in";
      url.search = `?next=${encodeURIComponent(returnTo)}`;
    } else {
      url.pathname = "/sign-in";
    }
    return NextResponse.redirect(url);
  }

  // If the user is signed in and trying to access auth routes,
  // redirect them to the home page — except pending-onboarding users, who
  // may only stay on the role picker and are sent back to it otherwise.
  if (user && authRoutes.some((route) => pathname.startsWith(route))) {
    const { data: profileData } = await supabase.from("users")
      .select("id, roles, account_status, mobile_number").eq("user_id", user.id).maybeSingle();
    const profile = profileData as unknown as {
      id: string;
      roles: string[] | null;
      account_status: string | null;
      mobile_number: string | null;
    } | null;
    if (profile && isPendingOnboarding(profile)) {
      if (pathname !== "/sign-up") {
        const url = request.nextUrl.clone();
        url.pathname = "/sign-up";
        url.search = "?from=google-new";
        return NextResponse.redirect(url);
      }
      return supabaseResponse;
    }
    if (profile) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  // Role-based protection
  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname === route || pathname.startsWith(`${route}/`),
  );

  if (user && isProtected) {
    const { data: profileData, error: profileError } = await supabase
      .from("users")
      .select("roles, account_status, mobile_number")
      .eq("user_id", user.id)
      .single();
    const profile = profileData as unknown as UserRolesProfile | null;
    // Pending-onboarding users hold no real portal yet (admins can never be
    // pending); send them to the role picker before any portal checks.
    if (
      isPendingOnboarding(
        profileData as unknown as {
          roles: string[] | null;
          account_status: string | null;
          mobile_number: string | null;
        } | null,
      )
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/sign-up";
      url.search = "?from=google-new";
      return NextResponse.redirect(url);
    }
    const profileRoles = profile?.roles ?? [];

    const role = defaultRole(profileRoles);
    const ownRoutes = role ? ROLE_ROUTES[role] : undefined;

    if (profileError || !ownRoutes) {
      // A suspended account can authenticate but RLS hides its profile row.
      const { data: suspension } = await supabase.rpc("get_my_suspension_status");
      const url = request.nextUrl.clone();
      if ((suspension as { suspended?: boolean } | null)?.suspended) {
        url.pathname = "/suspended";
        url.search = "";
      } else {
        url.pathname = "/sign-in";
      }
      return NextResponse.redirect(url);
    }

    const isWrongRoute = PROTECTED_ROUTES.some((route) => {
      const routeRole = Object.entries(ROLE_ROUTES).find(([, routes]) =>
        routes.includes(route),
      )?.[0];
      return (
        routeRole !== undefined &&
        !profileRoles.includes(routeRole) &&
        (pathname === route || pathname.startsWith(`${route}/`))
      );
    });

    if (isWrongRoute) {
      const url = request.nextUrl.clone();
      url.pathname = ownRoutes[0] ?? "/"; // redirect to their first/main route
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
