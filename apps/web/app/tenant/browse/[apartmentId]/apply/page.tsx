import { redirect } from "next/navigation";

import { createClient } from "@repo/supabase/server";

import ApplyClient from "@/app/browse/[apartmentId]/apply/components/ApplyClient";
import { getApplyApartmentContext } from "@/app/browse/[apartmentId]/apply/lib/get-apply-context";

export default async function TenantApplyPage({ params }: { params: Promise<{ apartmentId: string }> }) {
  const { apartmentId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("users")
    .select("id, roles")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!(profile as unknown as { roles: string[] } | null)?.roles.includes("tenant")) {
    redirect("/browse");
  }

  const apartmentContext = await getApplyApartmentContext(supabase, apartmentId);

  if (!apartmentContext) {
    return (
      <div className="max-w-3xl mx-auto p-4 py-12 text-center">
        <h1 className="text-2xl font-semibold">Apartment not found</h1>
        <p className="text-grey-700 mt-2">The listing you are trying to apply for does not exist.</p>
      </div>
    );
  }

  return <ApplyClient apartment={apartmentContext} />;
}
