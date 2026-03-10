import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from './types';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase URL or Anon Key is missing. Please check your environment variables.');
    return supabaseResponse;
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }: { name: string; value: string }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options: CookieOptions }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: Do NOT use supabase.auth.getSession() inside server code.
  // It reads from cookies which could be tampered with.
  // Use getUser() instead which validates the session with the Supabase Auth server.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Define protected route patterns
  const protectedRoutes = ['/dashboard', '/profile', '/settings', '/listings'];
  const authRoutes = ['/sign-in', '/sign-up', '/sign-up-form'];

  const pathname = request.nextUrl.pathname;

  // If the user is not signed in and trying to access a protected route,
  // redirect them to the sign-in page
  if (
    !user &&
    protectedRoutes.some((route) => pathname.startsWith(route))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/sign-in';
    return NextResponse.redirect(url);
  }

  // If the user is signed in and trying to access auth routes,
  // redirect them to the home page
  if (
    user &&
    authRoutes.some((route) => pathname.startsWith(route))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
