import { redirect } from "next/navigation";

import { createClient } from "@repo/supabase/server";

import ApartmentRatingsView from "@/app/browse/[apartmentId]/components/ApartmentRatingsView";

export default async function TenantRatingsPage() {
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

  return <ApartmentRatingsView />;
}
