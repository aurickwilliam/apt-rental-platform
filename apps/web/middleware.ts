import { type NextRequest } from 'next/server';
import { updateSession } from '@repo/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // api/auth/mobile: token endpoints for the native app. They carry no cookies,
    // and the signed-out redirect to /sign-in would swallow their JSON.
    '/((?!_next/static|_next/image|favicon.ico|api/auth/mobile|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
