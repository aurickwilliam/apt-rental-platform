import RecoveryLayout from "./components/RecoveryLayout";
import ForgotPasswordClient from "./components/ForgotPasswordClient";

// Recovery responses carry Auth cookies; never serve them from a cache.
export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  return (
    <RecoveryLayout>
      <ForgotPasswordClient />
    </RecoveryLayout>
  );
}
