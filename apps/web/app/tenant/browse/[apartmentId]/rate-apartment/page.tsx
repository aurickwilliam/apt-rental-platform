import { Suspense } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@repo/supabase/server";

import { RateApartmentForm } from "@/app/browse/[apartmentId]/rate-apartment/page";

export default async function TenantRateApartmentPage() {
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

  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl p-4 text-sm">Loading…</div>}>
      <RateApartmentForm />
    </Suspense>
  );
}
