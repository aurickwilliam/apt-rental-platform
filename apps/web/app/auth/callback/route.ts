import { NextResponse } from "next/server";
import { createClient } from "@repo/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        // In development, we can redirect directly
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        // In production behind a proxy/load balancer
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // If there's no code or an error occurred, redirect to sign-in with an error
  return NextResponse.redirect(`${origin}/sign-in?error=auth_callback_error`);
}
