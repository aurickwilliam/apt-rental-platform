import { redirect } from "next/navigation";

import { Card, Chip } from "@heroui/react";

import { createClient } from "@repo/supabase/server";

import ProfileAvatar from "@/app/components/profile/ProfileAvatar";
import ProfileForm from "@/app/components/profile/ProfileForm";

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

export default async function LandlordProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const { data: profile, error } = await supabase
    .from("users")
    .select(
      "email, first_name, last_name, middle_name, suffix, gender, mobile_number, birth_date, street_address, barangay, city, province, postal_code, role, account_status, avatar_url"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-4">
        <Card className="border border-danger-200 bg-card text-card-foreground p-6 rounded-2xl">
          <h1 className="text-xl font-bold">Profile</h1>
          <p className="text-sm text-danger mt-2">
            Couldn&apos;t load your profile: {error.message}
          </p>
        </Card>
      </div>
    );
  }

  if (!profile || profile.role !== "landlord") {
    redirect("/browse");
  }

  const displayName =
    `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || "Landlord";

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-4">
      <Card className="border border-border bg-card text-card-foreground p-6 rounded-2xl">
        <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
          <ProfileAvatar
            authUserId={user.id}
            initialUrl={profile.avatar_url}
            initials={getInitials(profile.first_name, profile.last_name, profile.email)}
            displayName={displayName}
          />
          <div className="flex flex-col items-center gap-1.5 min-w-0 sm:items-start">
            <h1 className="text-2xl font-bold">{displayName}</h1>
            <Chip size="sm" variant="soft">
              Landlord
            </Chip>
            {profile.email ? (
              <p className="text-sm text-muted-foreground truncate max-w-full">{profile.email}</p>
            ) : null}
          </div>
        </div>
      </Card>

      <Card className="border border-border bg-card text-card-foreground p-6 rounded-2xl">
        <ProfileForm initial={profile} />
      </Card>
    </div>
  );
}
