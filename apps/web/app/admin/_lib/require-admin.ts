import { createClient } from "@repo/supabase/server";
import { notFound, redirect } from "next/navigation";

export interface AdminProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  roles: string[];
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

  const { data: profileData, error } = await supabase
    .from("users")
    .select("id, first_name, last_name, email, roles")
    .eq("user_id", user.id)
    .single();

  if (error) {
    console.error("Unable to verify admin profile", error);
    throw new Error("Unable to verify administrator access.");
  }
  const profile = profileData as unknown as AdminProfile | null;
  if (!profile || !profile.roles.includes("admin")) notFound();

  return profile;
}
