import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./types";
import { isPendingOnboarding } from "./pending-onboarding";

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

  // Pages that anyone can access without logging in
  const publicRoutes = [
    "/",
    "/browse",
    "/forowners",
    "/sign-in",
    "/sign-up",
    "/sign-up-form",
    "/auth/callback",
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
    "/cookies"
  ];

  // Pages that logged-in users should be redirected away from
  const authRoutes = ["/sign-in", "/sign-up", "/sign-up-form"];

  const pathname = request.nextUrl.pathname;

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
      const url = request.nextUrl.clone();
      url.pathname = "/sign-in";
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
