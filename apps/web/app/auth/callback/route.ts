import { NextResponse } from "next/server";
import { createClient } from "@repo/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const isPopup = searchParams.get("popup") === "true";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      if (isPopup) {
        return new NextResponse(
          `<html><body><script>window.close();</script></body></html>`,
          { headers: { "Content-Type": "text/html" } },
        );
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      const isOAuth = user?.app_metadata?.provider === "google";

      if (isOAuth) {
        const { data: profile } = await supabase
          .from("users")
          .select("mobile_number")
          .eq("user_id", user!.id)
          .single();

        if (!profile?.mobile_number) {
          return NextResponse.redirect(`${origin}/complete-profile`);
        }
      }

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/sign-in?error=auth_callback_error`);
}
