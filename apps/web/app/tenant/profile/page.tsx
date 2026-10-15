import { redirect } from "next/navigation";
import { Suspense } from "react";

import { Card } from "@heroui/react";

import { createClient } from "@repo/supabase/server";

import ProfileForm from "@/app/components/profile/ProfileForm";
import type { ProfileInitial } from "@/app/components/profile/ProfileForm";
import AddRoleSection from "@/app/components/profile/AddRoleSection";
import ProfileHeader from "@/app/components/profile/ProfileHeader";
import PassportProfileCard from "@/app/components/passport/PassportProfileCard";

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
      "id, email, first_name, last_name, middle_name, suffix, gender, mobile_number, birth_date, street_address, barangay, city, province, postal_code, roles, account_status, avatar_url, background_url"
    )
    .eq("user_id", user.id)
    .maybeSingle();
  const profile = profileData as unknown as (ProfileInitial & {
    id: string;
    roles: string[];
    account_status: string;
    avatar_url: string | null;
    background_url: string | null;
  }) | null;

  if (error) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-4">
        <Card className="border border-danger-200 bg-card text-card-foreground p-6 rounded-2xl">
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
    <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-4">
      <ProfileHeader
        authUserId={user.id}
        displayName={displayName}
        initials={getInitials(profile.first_name, profile.last_name, profile.email)}
        email={profile.email}
        role="tenant"
        accountStatus={profile.account_status}
        avatarUrl={profile.avatar_url}
        backgroundUrl={profile.background_url}
      />

      <Suspense
        fallback={
          <div className="border border-border bg-card p-6 rounded-2xl" aria-hidden="true">
            <div className="h-6 w-40 rounded-lg bg-default-200 animate-pulse" />
          </div>
        }
      >
        <TenantVerificationCard userId={profile.id} accountStatus={profile.account_status} />
      </Suspense>

      <Card className="border border-border bg-card text-card-foreground p-6 rounded-2xl">
        <Card.Content className="p-0">
          <ProfileForm initial={profile} />
        </Card.Content>
      </Card>

      {/* AddRoleSection renders nothing when the account already holds the
          target role, so the wrapper must be gated too — otherwise a
          dual-role account gets an empty bordered card. */}
      {!profile.roles.includes("landlord") && (
        <Card className="border border-border bg-card text-card-foreground p-6 rounded-2xl">
          <Card.Content className="p-0">
            <AddRoleSection currentRoles={profile.roles ?? []} targetRole="landlord" />
          </Card.Content>
        </Card>
      )}
    </div>
  );
}
