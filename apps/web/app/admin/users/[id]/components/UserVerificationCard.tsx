import Link from "next/link";
import { IconShieldCheck } from "@tabler/icons-react";
import { Card, Chip } from "@heroui/react";
import { verificationChipColor } from "../../lib/user-display";
import { submittedFormatter } from "../../../verification/lib/verification-display";
import { DetailEmptyState } from "./UserDetailPrimitives";

export interface UserVerificationItem {
  id: string;
  id_type: string;
  status: string;
  submitted_at: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
  reviewer_name: string | null;
}

interface UserVerificationCardProps {
  accountStatus: string;
  verifications: UserVerificationItem[];
}

export default function UserVerificationCard({
  accountStatus,
  verifications,
}: UserVerificationCardProps) {
  const latest = verifications[0] ?? null;
  const pending = verifications.filter((item) => item.status === "pending");
  const actionId = pending[0]?.id ?? latest?.id ?? null;
  return (
    <Card className="rounded-3xl border border-border bg-card p-4 shadow-none sm:p-5">
      <Card.Content className="p-0">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="flex items-center gap-2 font-nunito text-lg font-bold text-primary">
          <IconShieldCheck size={20} className="shrink-0 text-primary" aria-hidden="true" />
          Verification
        </h2>
        <Chip
          size="sm"
          variant="soft"
          color={verificationChipColor(accountStatus)}
          className="capitalize"
        >
          {accountStatus}
        </Chip>
      </div>
      {latest ? (
        <div className="mt-3 text-sm">
          <p className="font-medium wrap-break-word">
            {latest.id_type} ·{" "}
            <span className="capitalize">{latest.status}</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Submitted{" "}
            {submittedFormatter.format(new Date(latest.submitted_at))}
            {` · ${verifications.length} attempt${verifications.length === 1 ? "" : "s"}`}
          </p>
          {actionId ? (
            <Link
              href={`/admin/verification/users/${actionId}`}
              className="mt-3 inline-block text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {pending.length ? "Review verification" : "View documents"}
            </Link>
          ) : null}
        </div>
      ) : (
        <DetailEmptyState>No verification submission</DetailEmptyState>
      )}
      </Card.Content>
    </Card>
  );
}
