"use client";

import Link from "next/link";
import { ExternalLink, Key, Mail } from "lucide-react";
import {
  IconExternalLink,
  IconKey,
  IconMail,
} from "@tabler/icons-react";

import SettingsRow from "../SettingsRow";
import ComingSoonChip from "../ComingSoonChip";

export default function SecurityTab({
  isAdmin = false,
  iconSet = "lucide",
}: {
  isAdmin?: boolean;
  iconSet?: "lucide" | "tabler";
}) {
  const KeyIcon = iconSet === "tabler" ? IconKey : Key;
  const MailIcon = iconSet === "tabler" ? IconMail : Mail;
  const ExternalIcon = iconSet === "tabler" ? IconExternalLink : ExternalLink;

  return (
    <>
      <h2 className="font-nunito text-lg font-bold text-primary">
        Security{isAdmin ? " & privacy" : ""}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {isAdmin
          ? "Manage your profile and review how your information is handled."
          : "Manage your account credentials."}
      </p>
      {isAdmin ? (
        <div className="mt-4 space-y-3">
          <Link
            href="/admin/profile/edit"
            className="block rounded-xl border border-border p-4 text-sm font-semibold text-primary hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Edit your profile{" "}
            <ExternalIcon
              size={16}
              className="ml-1 inline"
              aria-hidden="true"
            />
          </Link>
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
            <ExternalIcon
              size={16}
              className="ml-1 inline"
              aria-hidden="true"
            />
          </Link>
        </div>
      ) : (
        <div className="mt-3 divide-y divide-border">
          <SettingsRow
            icon={<KeyIcon size={18} />}
            title="Change Password"
            disabled
            suffix={<ComingSoonChip />}
          />
          <SettingsRow
            icon={<MailIcon size={18} />}
            title="Change Email"
            disabled
            suffix={<ComingSoonChip />}
          />
        </div>
      )}
    </>
  );
}
