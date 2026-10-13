import RecoveryLayout from "../components/RecoveryLayout";
import RecoverySessionEnded from "../components/RecoverySessionEnded";
import ResetPasswordClient from "../components/ResetPasswordClient";
import { hasActiveRecoverySession } from "../recovery-session";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage() {
  // The middleware already sends page loads without a recovery session back to
  // the start. This check covers server-action re-renders, which skip it.
  const isActive = await hasActiveRecoverySession();

  return (
    <RecoveryLayout>
      {isActive ? <ResetPasswordClient /> : <RecoverySessionEnded />}
    </RecoveryLayout>
  );
}
