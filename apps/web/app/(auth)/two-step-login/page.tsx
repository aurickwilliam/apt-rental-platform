import { redirect } from "next/navigation";

import { ADMIN_HOME } from "@/lib/admin-mfa";
import { getAdminMfaState } from "@/lib/server-admin-mfa";
import { getServerIdentity } from "@/lib/server-identity";
import RecoveryLayout from "../forgot-password/components/RecoveryLayout";
import TwoStepLoginClient from "./components/TwoStepLoginClient";

// Carries Auth cookies and a per-session level; never serve it from a cache.
export const dynamic = "force-dynamic";

interface TwoStepLoginPageProps {
  searchParams: Promise<{ mode?: string }>;
}

// Admin accounts only: set up an authenticator app, or enter its code to reach
// /admin. `?mode=add` (already verified) adds a backup device from Settings.
export default async function TwoStepLoginPage({ searchParams }: TwoStepLoginPageProps) {
  const { mode } = await searchParams;
  const { user, profile } = await getServerIdentity();

  if (!user) redirect("/sign-in");
  if (!profile?.roles.includes("admin")) redirect("/");
  if (profile.is_suspended) redirect("/suspended");

  const { currentLevel, hasVerifiedFactor } = await getAdminMfaState();
  const adding = mode === "add" && currentLevel === "aal2";
  if (currentLevel === "aal2" && !adding) redirect(ADMIN_HOME);

  const step = adding || !hasVerifiedFactor ? "enroll" : "challenge";

  return (
    <RecoveryLayout>
      <TwoStepLoginClient step={step} adding={adding} />
    </RecoveryLayout>
  );
}
