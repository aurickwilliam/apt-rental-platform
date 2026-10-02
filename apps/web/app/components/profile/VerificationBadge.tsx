import { Chip } from "@heroui/react";
import {
  IconClock,
  IconShield,
  IconShieldCheck,
  IconShieldX,
} from "@tabler/icons-react";

import { verificationChipColor } from "@/app/admin/users/lib/user-display";

type VerificationBadgeProps = {
  // Reads public.users.account_status: unverified | pending | verified | rejected.
  // Anything missing or unexpected falls back to Unverified.
  status: string | null | undefined;
};

const STATUS_META = {
  verified: { label: "Verified", Icon: IconShieldCheck },
  pending: { label: "Pending", Icon: IconClock },
  rejected: { label: "Rejected", Icon: IconShieldX },
  unverified: { label: "Unverified", Icon: IconShield },
} as const;

export default function VerificationBadge({ status }: VerificationBadgeProps) {
  const key =
    status === "verified" || status === "pending" || status === "rejected"
      ? status
      : "unverified";
  const { label, Icon } = STATUS_META[key];
  return (
    <Chip
      size="sm"
      variant="soft"
      color={verificationChipColor(key)}
      className="shrink-0 capitalize"
    >
      <span className="flex items-center gap-1">
        <Icon size={14} aria-hidden="true" />
        {label}
      </span>
    </Chip>
  );
}
