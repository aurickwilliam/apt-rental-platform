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
    // Mirrors sign-in: min-h-screen so the page grows instead of clipping
    // at short aspect ratios; fluid clamp() padding on both axes.
    <main className="flex min-h-screen w-full bg-surface">
      <section className="flex w-full min-w-0 flex-1 flex-col lg:w-1/2 lg:flex-none">
        <div className="mx-auto flex w-full min-w-0 max-w-xl flex-1 flex-col justify-center px-[clamp(1.25rem,4vw,4rem)] py-[clamp(1rem,4vh,2.5rem)] lg:max-w-none">
          <AuthWrapper
            type="sign-up"
            initialRole={initialRole}
            showWelcomeNotice={showWelcomeNotice}
            rolePickerMode={rolePickerMode}
            portalError={portalError}
          />
        </div>
      </section>

      <aside
        aria-hidden="true"
        className="relative hidden w-1/2 shrink-0 overflow-hidden bg-primary bg-cover bg-center lg:block lg:min-h-screen"
        style={{ backgroundImage: "url('/building-bg2.jpg')" }}
      >
        <div className="relative z-10 flex h-full w-full flex-col items-end justify-between p-5">
          <Image
            src="/logo/logo-name.svg"
            alt="APT Logo"
            width={150}
            height={100}
          />
        </div>
      </aside>
    </main>
  );
}