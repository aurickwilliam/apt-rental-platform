import { redirect } from "next/navigation";
import Image from "next/image";

import { createClient } from "@repo/supabase/server";

import CompleteProfileForm from "./components/CompleteProfileForm";

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
  const { data: profile } = await supabase
    .from("users")
    .select("mobile_number, first_name, last_name, email, role")
    .eq("user_id", user.id)
    .single();

  if (profile?.mobile_number) redirect("/");

  const profileRole = profile?.role === "landlord" ? "landlord" : "tenant";
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
