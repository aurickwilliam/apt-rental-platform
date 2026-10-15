"use client";

import Link from "next/link";
import {
  IconExternalLink,
  IconKey,
  IconMail,
} from "@tabler/icons-react";

import { useEmailChangeEligibility } from "@/hooks/use-email-change-eligibility";
import { usePasswordSignInStatus } from "@/hooks/use-password-sign-in-status";
import SettingsRow from "../SettingsRow";
import StatusChip from "../StatusChip";

export default function SecurityTab({
  isAdmin = false,
  onChangePassword,
  onChangeEmail,
}: {
  isAdmin?: boolean;
  // Closes Settings and opens the Change Password modal.
  onChangePassword: () => void;
  // Closes Settings and opens the Change Email modal.
  onChangeEmail: () => void;
}) {
  if (!isAdmin) return <AccountSecurity onChangePassword={onChangePassword} onChangeEmail={onChangeEmail} />;

  return (
    <>
      <h2 className="font-nunito text-lg font-bold text-primary">
        Security & privacy
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Review how your information is handled.
      </p>
      <div className="mt-4 space-y-3">
        <div className="rounded-xl border border-border p-4 text-sm">
          <p className="font-semibold">Password and email</p>
          <p className="mt-1 text-muted-foreground">
            Account credential changes are not available here yet.
          </p>
        </div>
        <Link
          href="/pap"
          className="block rounded-xl border border-border p-4 text-sm font-semibold text-primary hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Privacy policy{" "}
          <IconExternalLink
            size={16}
            className="ml-1 inline"
            aria-hidden="true"
          />
        </Link>
      </div>
    </>
  );
}

// Tenant/landlord credentials. Google sign-in accounts (including linked
// Google + password) cannot change their email here.
function AccountSecurity({ onChangePassword, onChangeEmail }: { onChangePassword: () => void; onChangeEmail: () => void }) {
  const { status, loading } = usePasswordSignInStatus();
  const { status: emailStatus, loading: emailLoading } = useEmailChangeEligibility();

  const canChangePassword = !loading && status === "has_password";
  const canChangeEmail = !emailLoading && emailStatus === "eligible";

  return (
    <>
      <h2 className="font-nunito text-lg font-bold text-primary">Security</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage your account credentials.
      </p>
      <div className="mt-3 divide-y divide-border">
        <SettingsRow
          icon={<IconKey size={18} />}
          title="Change Password"
          onClick={onChangePassword}
          disabled={!canChangePassword}
          suffix={
            !loading && status === "no_password" ? (
              <StatusChip label="Signed in with Google" />
            ) : undefined
          }
        />
        <SettingsRow
          icon={<IconMail size={18} />}
          title="Change Email"
          onClick={onChangeEmail}
          disabled={!canChangeEmail}
          suffix={
            !emailLoading && emailStatus === "google" ? (
              <StatusChip label="Signed in with Google" />
            ) : undefined
          }
        />
      </div>
    </>
  );
}
