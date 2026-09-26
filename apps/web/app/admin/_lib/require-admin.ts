import { createClient } from "@repo/supabase/server";
import { notFound } from "next/navigation";

export interface AdminProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

export async function requireAdmin(): Promise<AdminProfile> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) notFound();

  const { data: profile } = await supabase
    .from("users")
    .select("id, first_name, last_name, email, role")
    .eq("user_id", user.id)
    .single();

  if (!profile || profile.role !== "admin") notFound();

  return profile;
}
