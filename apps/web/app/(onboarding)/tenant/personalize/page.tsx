import { redirect } from "next/navigation";
import Image from "next/image";

import { createClient } from "@repo/supabase/server";

import PersonalizeWizard from "./components/PersonalizeWizard";

type PersonalizePageProps = {
  searchParams: Promise<{ fresh?: string }>;
};

// Tenant onboarding personalization. This route lives outside the tenant
// dashboard layout on purpose: personalization continues the Complete
// Tenant Form experience, and the dashboard sidebar appears only after
// onboarding is completed or skipped.
//
// Shown once right after profile completion (?fresh=1) or when no
// preferences exist yet. Returning tenants with saved preferences go
// straight to their dashboard — onboarding is offered, never forced, so
// refresh loops are impossible.
export default async function PersonalizePage({ searchParams }: PersonalizePageProps) {
  const { fresh } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("users")
    .select("roles, preferences")
    .eq("user_id", user.id)
    .maybeSingle<{ roles: string[]; preferences: unknown }>();

  if (!profile?.roles.includes("tenant")) redirect("/");
  if (profile.preferences !== null && fresh !== "1") {
    redirect("/tenant/my-rental");
  }

  return (
    <div className="min-h-screen w-full bg-card">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <Image src="/logo/logo.svg" alt="APT Logo" width={72} height={72} />
        <h1 className="mt-6 font-nunito text-3xl font-bold text-foreground">
          Personalize your experience
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Tell us what you&apos;re looking for in your next place.
        </p>
        <div className="mt-8">
          <PersonalizeWizard initial={profile.preferences} />
        </div>
      </div>
    </div>
  );
}
