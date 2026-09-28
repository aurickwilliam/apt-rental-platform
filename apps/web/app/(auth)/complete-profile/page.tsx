import { redirect } from "next/navigation";
import Image from "next/image";

import { createClient } from "@repo/supabase/server";
import { preferredPortal } from "@/lib/portal-preference";

import CompleteProfileForm from "./components/CompleteProfileForm";

interface UserRolesProfile {
  mobile_number: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  roles: string[];
  account_status: string;
}

type CompleteProfilePageProps = {
  searchParams: Promise<{
    role?: string;
  }>;
};

export default async function CompleteProfilePage({
  searchParams,
}: CompleteProfilePageProps) {
  const { role: requestedRole } = await searchParams;
  const role =
    requestedRole === "landlord" || requestedRole === "tenant"
      ? requestedRole
      : null;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  // If already complete, skip this page
  const { data: profileData } = await supabase
    .from("users")
    .select("mobile_number, first_name, last_name, email, roles, account_status")
    .eq("user_id", user.id)
    .single();
  const profile = profileData as unknown as UserRolesProfile | null;

  if (profile?.roles.includes("admin")) redirect("/admin/dashboard");
  if (profile?.mobile_number) redirect("/");
  if (profile?.account_status !== "unverified") {
    const portal = preferredPortal(profile?.roles ?? [], role);
    redirect(portal === "landlord" ? "/landlord/dashboard" : portal === "tenant" ? "/tenant/my-rental" : "/");
  }

  const profileRole = profile?.roles.includes("landlord")
    ? "landlord"
    : "tenant";
  const effectiveRole = role ?? profileRole;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-8">
          <Image src="/logo/logo.svg" alt="APT Logo" width={75} height={75} />
        </div>

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold font-noto-serif text-default-900">
            Complete the {effectiveRole === "landlord" ? "Landlord" : "Tenant"} Form
          </h1>
          <p className="text-default-500 mt-1">
            Join us and start your apartment rental journey today!
          </p>
        </div>

        {/* Form */}
        <CompleteProfileForm
          email={profile?.email ?? user.email ?? ""}
          firstName={profile?.first_name ?? ""}
          lastName={profile?.last_name ?? ""}
          role={effectiveRole}
        />
      </div>
    </div>
  );
}
