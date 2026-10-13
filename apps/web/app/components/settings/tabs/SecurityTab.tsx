"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  IconExternalLink,
  IconKey,
  IconMail,
} from "@tabler/icons-react";

import { usePasswordSignInStatus } from "@/hooks/use-password-sign-in-status";
import SettingsRow from "../SettingsRow";
import ComingSoonChip from "../ComingSoonChip";
import StatusChip from "../StatusChip";
import ChangePasswordForm from "../ChangePasswordForm";

type SecurityView = "list" | "change-password";

export default function SecurityTab({
  isAdmin = false,
}: {
  isAdmin?: boolean;
}) {
  if (!isAdmin) return <AccountSecurity />;

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

// Tenant/landlord credentials. Change Password opens as a sub-view in this
// tab (mobile opens a separate screen); Google-only accounts have no password.
function AccountSecurity() {
  const { status, loading } = usePasswordSignInStatus();
  const [view, setView] = useState<SecurityView>("list");

  // Back on the list after the form closes, return focus to its row.
  const rowsRef = useRef<HTMLDivElement>(null);
  const restoreFocus = useRef(false);
  useEffect(() => {
    if (view !== "list" || !restoreFocus.current) return;
    restoreFocus.current = false;
    rowsRef.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();
  }, [view]);

  if (view === "change-password") {
    return (
      <ChangePasswordForm
        onClose={() => {
          restoreFocus.current = true;
          setView("list");
        }}
      />
    );
  }

  const canChangePassword = !loading && status === "has_password";

  return (
    <>
      <h2 className="font-nunito text-lg font-bold text-primary">Security</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage your account credentials.
      </p>
      <div ref={rowsRef} className="mt-3 divide-y divide-border">
        <SettingsRow
          icon={<IconKey size={18} />}
          title="Change Password"
          onClick={() => setView("change-password")}
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
          disabled
          suffix={<ComingSoonChip />}
        />
      </div>
    </>
  );
}
