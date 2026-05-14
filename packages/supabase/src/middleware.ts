import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr/dist/main/types";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./types";

const ROLE_ROUTES: Record<string, string[]> = {
  tenant: ["/tenant"],
  landlord: ["/landlord"],
  admin: ["/admin"],
};

const PROTECTED_ROUTES = Object.values(ROLE_ROUTES).flat();

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
        cookiesToSet: { name: string; value: string; options: CookieOptions }[],
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
  ];

  // Pages that logged-in users should be redirected away from
  const authRoutes = ["/sign-in", "/sign-up", "/sign-up-form"];

  const pathname = request.nextUrl.pathname;

  const isPublicRoute = publicRoutes.some((route) =>
    route === "/" ? pathname === "/" : pathname.startsWith(route),
  );

  // If the user is not signed in and trying to access a non-public route,
  // redirect them to the sign-in page
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    return NextResponse.redirect(url);
  }

  // If the user is signed in and trying to access auth routes,
  // redirect them to the home page
  if (user && authRoutes.some((route) => pathname.startsWith(route))) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Role-based protection
  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route),
  );

  if (user && isProtected) {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("user_id", user.id)
      .single();

    const role = profile?.role as string;
    const ownRoutes = ROLE_ROUTES[role];

    const isWrongRoute = PROTECTED_ROUTES.some(
      (route) => !ownRoutes.includes(route) && pathname.startsWith(route),
    );

    if (isWrongRoute) {
      const url = request.nextUrl.clone();
      url.pathname = ownRoutes[0] ?? "/"; // redirect to their first/main route
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
