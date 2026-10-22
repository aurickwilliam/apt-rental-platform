import { redirect } from "next/navigation";
import { createClient } from "@repo/supabase/server";

import { fetchActiveTenancyWith, type InitialRentalContext } from "@/service/tenancy-context";
import MyRentalClient from "./MyRentalClient";

export default async function MyRentalPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile, error } = await supabase.from("users")
    .select("id, roles").eq("user_id", user.id).single();
  if (error) throw new Error("Unable to verify rental access.");
  if (!profile?.roles.includes("tenant")) redirect("/browse");

  const initialContext: InitialRentalContext = { authUserId: user.id, tenancy: null, error: null, renderedAt: new Date().toISOString() };
  try {
    initialContext.tenancy = await fetchActiveTenancyWith(supabase, profile.id);
  } catch (error) {
    console.error("Unable to load initial rental context", error);
    initialContext.error = "Unable to load your rental. Please try again.";
  }

  // loading.tsx owns the initial context wait. Finance remains an independent,
  // fresh browser read; the hydrated client must not fetch this context twice.
  return <MyRentalClient key={user.id} initialContext={initialContext} />;
}
