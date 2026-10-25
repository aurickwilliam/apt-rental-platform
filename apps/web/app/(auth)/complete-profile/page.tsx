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
  province: string | null;
  city: string | null;
  barangay: string | null;
  street_address: string | null;
  postal_code: number | null;
  birth_date: string | null;
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
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) redirect("/sign-in");

  // If already complete, skip this page
  const { data: profileData } = await supabase
    .from("users")
    .select("mobile_number, first_name, last_name, email, roles, account_status, province, city, barangay, street_address, postal_code, birth_date")
    .eq("user_id", user.id)
    .maybeSingle();
  const profile = profileData as unknown as UserRolesProfile | null;

  // No profile row: a confirmed account whose sign-up was interrupted, and the
  // form creates the profile. A suspended account looks the same under RLS.
  if (!profile) {
    const { data: suspension } = await supabase.rpc("get_my_suspension_status");
    if ((suspension as { suspended?: boolean } | null)?.suspended) redirect("/suspended");
  }
  if (profile?.roles.includes("admin")) redirect("/admin/dashboard");
  if (profile?.mobile_number) redirect("/");
  if (profile && profile.account_status !== "unverified") {
    const portal = preferredPortal(profile?.roles ?? [], role);
    redirect(portal === "landlord" ? "/landlord/dashboard" : portal === "tenant" ? "/tenant/my-rental" : "/");
  }

  const profileRole = profile?.roles.includes("landlord")
    ? "landlord"
    : "tenant";
  const effectiveRole = role ?? profileRole;

  return (
    // min-h-screen + fluid padding: the page grows rather than clipping
    // when the viewport gets short (4:3, 1:1) or wide (21:9).
    <div className="min-h-screen w-full bg-card">
      <div className="mx-auto w-full max-w-4xl px-[clamp(1rem,4vw,2rem)] py-[clamp(1.5rem,4vh,2rem)]">
        {/* Header */}
        <div className="mb-[clamp(1.5rem,4vh,2rem)] flex flex-col gap-4">
          <Image src="/logo/logo.svg" alt="APT Logo" width={75} height={75} />
        </div>

        {/* Title */}
        <div className="mb-[clamp(1.5rem,4vh,2rem)]">
          <h1 className="text-[clamp(1.5rem,4vw,1.875rem)] font-semibold font-noto-serif text-default-900">
            Complete the {effectiveRole === "landlord" ? "Landlord" : "Tenant"} Form
          </h1>
          <p className="mt-1 text-default-500">
            Join us and start your apartment rental journey today!
          </p>
        </div>

        {/* Form */}
        <CompleteProfileForm
          key={user.id}
          email={profile?.email ?? user.email ?? ""}
          firstName={profile?.first_name ?? ""}
          lastName={profile?.last_name ?? ""}
          role={effectiveRole}
          initialBirthDate={profile?.birth_date ?? ""}
          initialAddress={{ province: profile?.province ?? "", city: profile?.city ?? "", barangay: profile?.barangay ?? "",
            streetAddress: profile?.street_address ?? "", postalCode: profile?.postal_code == null ? "" : String(profile.postal_code) }}
        />
      </div>
    </div>
  );
}
