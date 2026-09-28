import {
  getAccountAgeDays,
  joinedFormatter,
  type AdminUserDetail,
} from "../../lib/user-display";
import { InfoField } from "./UserDetailPrimitives";

interface UserTrustSafetyProps {
  user: AdminUserDetail;
  suspendedByName: string | null;
  verificationAttempts: number;
  suspensionSupported: boolean;
}

export default function UserTrustSafety({
  user,
  suspendedByName,
  verificationAttempts,
  suspensionSupported,
}: UserTrustSafetyProps) {
  const accountAgeDays = getAccountAgeDays(user.created_at);
  return (
    <section className="rounded-3xl border border-border bg-card p-4 sm:p-5">
      <h2 className="font-nunito text-lg font-bold">Trust and safety</h2>
      <dl className="mt-3 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
        <InfoField
          label="Account status"
          value={user.is_suspended ? "Suspended" : "Active"}
        />
        <InfoField
          label="Account age"
          value={`${accountAgeDays} day${accountAgeDays === 1 ? "" : "s"}`}
        />
        <InfoField
          label="Verification attempts"
          value={String(verificationAttempts)}
        />
        <InfoField
          label="Suspension detail"
          value={
            user.is_suspended
              ? `${user.suspension_reason ?? "No reason recorded"}${user.suspended_at ? ` · ${joinedFormatter.format(new Date(user.suspended_at))}` : ""}${suspendedByName ? ` by ${suspendedByName}` : ""}`
              : "—"
          }
        />
      </dl>
      {suspensionSupported ? null : (
        <p className="mt-3 text-xs text-muted-foreground">
          Account suspension is unavailable until the phase-2 admin operations
          migration is applied.
        </p>
      )}
    </section>
  );
}
