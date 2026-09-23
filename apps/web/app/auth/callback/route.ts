import { NextResponse } from "next/server";
import { createClient } from "@repo/supabase/server";

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

      if (user) {
        const { data: profile } = await supabase
          .from("users")
          .select("mobile_number, role")
          .eq("user_id", user.id)
          .single();
        profileRole = profile?.role ?? null;

        if (isOAuth && role && profile && !profile.mobile_number && profile.role !== "admin") {
          const { error: roleError } = await supabase.rpc("set_onboarding_role", { requested_role: role });
          if (roleError) {
            console.error("Could not set OAuth onboarding role", roleError);
            await supabase.auth.signOut();
            return NextResponse.redirect(`${origin}/sign-in?error=auth_callback_error`);
          }
          profileRole = role;
        }

        if (!isPopup && isOAuth && profileRole !== "admin" && !profile?.mobile_number) {
          return NextResponse.redirect(
            `${origin}/complete-profile${role ? `?role=${role}` : ""}`,
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
