import { redirect } from "next/navigation";

import { RECOVERY_START_PATH } from "@repo/supabase/password-recovery";

import RecoveryLayout from "../components/RecoveryLayout";
import ResetPasswordClient from "../components/ResetPasswordClient";
import { hasActiveRecoverySession } from "../recovery-session";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage() {
  // Second line of defense behind the middleware: only a verified recovery
  // code may reach this page; anything else starts the flow again.
  if (!(await hasActiveRecoverySession())) redirect(RECOVERY_START_PATH);

  return (
    <RecoveryLayout>
      <ResetPasswordClient />
    </RecoveryLayout>
  );
}
