"use client";

import Link from "next/link";
import {
  IconExternalLink,
  IconKey,
  IconMail,
} from "@tabler/icons-react";
import { Separator } from "@heroui/react";

import { useTranslation } from "@/app/components/i18n/LocaleProvider";
import { useEmailChangeEligibility } from "@/hooks/use-email-change-eligibility";
import { usePasswordSignInStatus } from "@/hooks/use-password-sign-in-status";
import SettingsRow from "../SettingsRow";
import StatusChip from "../StatusChip";
import AdminTwoStep from "./AdminTwoStep";

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
  const { t } = useTranslation();

  if (!isAdmin) return <AccountSecurity onChangePassword={onChangePassword} onChangeEmail={onChangeEmail} />;

  return (
    <>
      <h2 className="font-nunito text-lg font-bold text-primary">
        {t("settings.security.admin.title")}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("settings.security.admin.description")}
      </p>
      <AdminTwoStep />
      <div className="mt-4 space-y-3">
        <div className="rounded-xl border border-border p-4 text-sm">
          <p className="font-semibold text-foreground">
            {t("settings.security.credentialsTitle")}
          </p>
          <p className="mt-1 text-muted-foreground">
            {t("settings.security.credentialsBody")}
          </p>
        </div>
        <Link
          href="/pap"
          className="block rounded-xl border border-border p-4 text-sm font-semibold text-primary hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {t("settings.security.privacyPolicy")}{" "}
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
  const { t } = useTranslation();
  const { status, loading } = usePasswordSignInStatus();
  const { status: emailStatus, loading: emailLoading } = useEmailChangeEligibility();

  const canChangePassword = !loading && status === "has_password";
  const canChangeEmail = !emailLoading && emailStatus === "eligible";

  return (
    <>
      <h2 className="font-nunito text-lg font-bold text-primary">
        {t("settings.security.title")}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("settings.security.description")}
      </p>
      <div className="mt-3 flex flex-col gap-1">
        <SettingsRow
          icon={<IconKey size={18} />}
          title={t("settings.security.changePassword")}
          onClick={onChangePassword}
          disabled={!canChangePassword}
          suffix={
            !loading && status === "no_password" ? (
              <StatusChip label={t("settings.security.googleOnly")} />
            ) : undefined
          }
        />
        <Separator />
        <SettingsRow
          icon={<IconMail size={18} />}
          title={t("settings.security.changeEmail")}
          onClick={onChangeEmail}
          disabled={!canChangeEmail}
          suffix={
            !emailLoading && emailStatus === "google" ? (
              <StatusChip label={t("settings.security.googleOnly")} />
            ) : undefined
          }
        />
      </div>
    </>
  );
}
