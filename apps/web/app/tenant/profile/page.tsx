import { redirect } from "next/navigation";
import { Suspense } from "react";

import { Card } from "@heroui/react";

import { createClient } from "@repo/supabase/server";

import ProfileForm from "@/app/components/profile/ProfileForm";
import type { ProfileInitial } from "@/app/components/profile/ProfileForm";
import AddRoleSection from "@/app/components/profile/AddRoleSection";
import ProfileHeader from "@/app/components/profile/ProfileHeader";
import PassportProfileCard from "@/app/components/passport/PassportProfileCard";
import VerificationStatusCard from "@/app/components/profile/VerificationStatusCard";

function getInitials(firstName: string | null, lastName: string | null, email: string | null) {
  const name = `${firstName ?? ""} ${lastName ?? ""}`.trim();
  if (name) {
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }
  return email?.[0]?.toUpperCase() ?? "U";
}

// Latest verification submission for the activity timeline. Streams in
// separately (see Suspense below) so it never blocks the header and form
// first paint. userId is the internal users.id, not the auth id.
async function TenantVerificationCard({
  userId,
  accountStatus,
}: {
  userId: string;
  accountStatus: string;
}) {
  const supabase = await createClient();
  const { data: verification } = await supabase
    .from("user_verifications")
    .select("status, submitted_at, reviewed_at, rejection_reason")
    .eq("user_id", userId)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <PassportProfileCard accountStatus={accountStatus} basePath="/tenant/passport" verification={verification} />
  );
}

export default async function TenantProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const { data: profileData, error } = await supabase
    .from("users")
    .select(
      "id, email, first_name, last_name, middle_name, suffix, gender, mobile_number, birth_date, street_address, barangay, city, province, postal_code, roles, account_status, avatar_url, background_url, created_at"
    )
    .eq("user_id", user.id)
    .maybeSingle();
  const profile = profileData as unknown as (ProfileInitial & {
    id: string;
    roles: string[];
    account_status: string;
    avatar_url: string | null;
    background_url: string | null;
    created_at: string | null;
  }) | null;

  if (error) {
    return (
      <div className="mx-auto w-full max-w-7xl p-4">
        <Card className="rounded-3xl border border-danger-200 bg-card p-4 text-card-foreground shadow-none sm:p-5">
          <h1 className="text-xl font-bold">Profile</h1>
          <p className="text-sm text-danger mt-2">
            Couldn&apos;t load your profile: {error.message}
          </p>
        </Card>
      </div>
    );
  }

  if (!profile?.roles.includes("tenant")) {
    redirect("/browse");
  }

  // Verification timeline streams in below; owners read only their own
  // rows, absent when the user never submitted.
  const displayName =
    `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || "Tenant";

  return (
    <div className="mx-auto w-full max-w-7xl p-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        <div className="grid min-w-0 grid-cols-1 content-start gap-3">
          <ProfileHeader
            authUserId={user.id}
            displayName={displayName}
            initials={getInitials(profile.first_name, profile.last_name, profile.email)}
            role="tenant"
            accountStatus={profile.account_status}
            avatarUrl={profile.avatar_url}
            backgroundUrl={profile.background_url}
            joinedAt={profile.created_at}
          />

          <Card className="rounded-3xl border border-border bg-card p-4 text-card-foreground shadow-none sm:p-5">
            <Card.Content className="p-0">
              <ProfileForm initial={profile} />
            </Card.Content>
          </Card>
        </div>

        <div className="grid h-fit grid-cols-1 content-start gap-3">
          <VerificationStatusCard accountStatus={profile.account_status} role="tenant" verification={verification} />
          <PassportProfileCard accountStatus={profile.account_status} basePath="/tenant/passport" />

          {/* AddRoleSection renders nothing when the account already holds the
              target role, so the wrapper must be gated too — otherwise a
              dual-role account gets an empty bordered card. */}
          {!profile.roles.includes("landlord") && (
            <Card className="rounded-3xl border border-border bg-card p-4 text-card-foreground shadow-none sm:p-5">
              <Card.Content className="p-0">
                <AddRoleSection currentRoles={profile.roles ?? []} targetRole="landlord" />
              </Card.Content>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
