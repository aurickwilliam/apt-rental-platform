import Image from "next/image";

import { translate } from "@repo/i18n";
import { createClient } from "@repo/supabase/server";
import { isPendingOnboarding } from "@repo/supabase/pending-onboarding";

import { getServerLocale } from "@/lib/i18n/locale";

import AuthWrapper from "../components/AuthWrapper";

interface SignUpPageProps {
  searchParams: Promise<{ role?: string; from?: string; error?: string }>;
}

export default async function SignUp({ searchParams }: SignUpPageProps) {
  const { role, from, error } = await searchParams;
  const language = await getServerLocale();
  const initialRole = role === 'landlord' ? 'landlord' : 'tenant';
  // First-time Google arrivals from sign-in (no profile yet) get a
  // contextual welcome banner; normal visits never set this param.
  const showWelcomeNotice = from === 'google-new';
  // A confirmed account whose profile was never saved lands here from the
  // middleware / sign-in to finish it.
  const showProfileMissingNotice = from === 'profile-missing';
  // OAuth failures surface here in the same tab (the session was signed
  // out in the callback so this page stays reachable).
  const portalError =
    error === "grant_failed"
      ? translate(language, "auth.error.grantFailed")
      : null;

  // Pending-onboarding users arrive here authenticated with a placeholder
  // profile. Render the role picker (banner + selector + Continue) instead
  // of the email form. Logged-out visitors and everyone else get the
  // normal sign-up flow.
  let rolePickerMode = false;
  let profileMissing = false;
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
    if (!rolePickerMode && !profileData && showProfileMissingNotice) {
      // Only the middleware / sign-in send people here with this flag; a
      // suspended account (profile hidden by RLS) never finishes a profile.
      const { data: suspension } = await supabase.rpc("get_my_suspension_status");
      profileMissing = (suspension as { suspended?: boolean } | null)?.suspended !== true;
      rolePickerMode = profileMissing;
    }
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
            profileMissing={profileMissing}
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
            height={69}
          />
        </div>
      </aside>
    </main>
  );
}