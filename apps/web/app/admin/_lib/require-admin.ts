import { createClient } from "@repo/supabase/server";
import { notFound, redirect } from "next/navigation";

export interface AdminProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

export async function requireAdmin(): Promise<AdminProfile> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user) {
    if (authError && authError.name !== "AuthSessionMissingError") {
      console.error("Unable to verify admin session", authError);
    }
    redirect("/sign-in");
  }

  const { data: profile, error } = await supabase
    .from("users")
    .select("id, first_name, last_name, email, role, is_suspended")
    .eq("user_id", user.id)
    .single();

  // Older APT projects have admin roles but have not deployed the suspension column yet.
  // Only fall back for that specific schema mismatch; never ignore other query failures.
  if (error?.code === "42703" && error.message.includes("is_suspended")) {
    const { data: legacyProfile, error: legacyError } = await supabase
      .from("users")
      .select("id, first_name, last_name, email, role")
      .eq("user_id", user.id)
      .single();

    if (legacyError) {
      console.error("Unable to verify admin profile", legacyError);
      throw new Error("Unable to verify administrator access.");
    }
    if (!legacyProfile || legacyProfile.role !== "admin") notFound();
    return legacyProfile;
  }

  if (error) {
    console.error("Unable to verify admin profile", error);
    throw new Error("Unable to verify administrator access.");
  }
  if (!profile || profile.role !== "admin" || profile.is_suspended) notFound();

  return profile;
}
