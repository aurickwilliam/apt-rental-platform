import { getServerIdentity, requirePortalViewer } from "@/lib/server-identity";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";

export interface AdminProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  email: string | null;
  roles: string[];
}

export const requireAdmin = cache(async (): Promise<AdminProfile> => {
  const { user, profile: profileData, error: authError } = await getServerIdentity();

  if (!user) {
    if (authError && authError.name !== "AuthSessionMissingError") {
      console.error("Unable to verify admin session", authError);
    }
    redirect("/sign-in");
  }

  if (authError) {
    console.error("Unable to verify admin profile", authError);
    throw new Error("Unable to verify administrator access.");
  }
  const profile = profileData as unknown as AdminProfile | null;
  if (!profile || !profile.roles.includes("admin")) notFound();
  await requirePortalViewer("admin");

  return {
    id: profile.id,
    first_name: profile.first_name,
    last_name: profile.last_name,
    email: profile.email,
    roles: profile.roles,
    avatar_url: profile.avatar_url ?? user.user_metadata.avatar_url ?? null,
  };
});
