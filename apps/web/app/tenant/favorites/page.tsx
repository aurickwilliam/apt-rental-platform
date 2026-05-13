import { redirect } from "next/navigation";

import { createClient } from "@repo/supabase/server";

import FavoritesClient from "./components/FavoritesClient";

export default async function FavoritesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("users")
    .select("id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "tenant") {
    redirect("/browse");
  }

  return <FavoritesClient />;
}
