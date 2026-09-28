import Image from "next/image";
import AuthWrapper from "../components/AuthWrapper";
import { createClient } from "@repo/supabase/server";
import { isPendingOnboarding } from "@repo/supabase";

interface SignUpPageProps {
  searchParams: Promise<{ role?: string; from?: string; error?: string }>;
}

export default async function SignUp({ searchParams }: SignUpPageProps) {
  const { role, from, error } = await searchParams;
  const initialRole = role === 'landlord' ? 'landlord' : 'tenant';
  // First-time Google arrivals from sign-in (no profile yet) get a
  // contextual welcome banner; normal visits never set this param.
  const showWelcomeNotice = from === 'google-new';
  // OAuth failures surface here in the same tab (the session was signed
  // out in the callback so this page stays reachable).
  const portalError =
    error === "role_mismatch"
      ? "Admin accounts cannot add tenant or landlord roles."
      : error === "grant_failed"
        ? "We couldn't add that role to your account. Please sign in and try adding it from your profile."
        : null;

  // Pending-onboarding users arrive here authenticated with a placeholder
  // profile. Render the role picker (banner + selector + Continue) instead
  // of the email form. Logged-out visitors and everyone else get the
  // normal sign-up flow.
  let rolePickerMode = false;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: profileData } = await supabase
      .from("users")
      .select("roles, account_status, mobile_number")
      .eq("user_id", user.id)
      .maybeSingle();
    rolePickerMode = isPendingOnboarding(
      profileData as unknown as {
        roles: string[] | null;
        account_status: string | null;
        mobile_number: string | null;
      } | null,
    );
  }

  return (
    <main className="flex w-screen h-screen overflow-hidden">
      {/* Left Panel */}
      <div className="w-1/2">
        <AuthWrapper
          type="sign-up"
          initialRole={initialRole}
          showWelcomeNotice={showWelcomeNotice}
          rolePickerMode={rolePickerMode}
          portalError={portalError}
        />
      </div>
      
      {/* Right Panel */}
      <div
        className="w-1/2 bg-primary relative hidden md:flex"
        style={{backgroundImage: "url('/building-bg2.jpg')"}}
      >
        {/* Content */}
        <div className="relative z-10 p-5 h-full flex flex-col justify-between items-end">
          <Image
            src="/logo/logo-name.svg"
            alt="Logo"
            width={150}
            height={100}
          />

          {/* Can add Information or Testimonials here */}
        </div>
      </div>
    </main>
  );
}
