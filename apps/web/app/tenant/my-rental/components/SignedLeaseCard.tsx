"use client";

import { useState } from "react";
import { Button } from "@heroui/react";
import { IconFileText as FileText, IconShieldCheck as ShieldCheck } from "@tabler/icons-react";

import ErrorBanner from "@/app/components/display/ErrorBanner";
import { formatLeaseDate } from "@/app/tenant/payment/utils";
import { signedLeaseStatus } from "@/lib/signed-lease";
import { acknowledgeSignedLease } from "@/service/signedLeaseService";

import DashboardCard from "./DashboardCard";
import StatusChip from "./StatusChip";

interface SignedLeaseCardProps {
  tenancyId: string;
  /** Storage path of the landlord's executed contract, when one exists. */
  path: string | null;
  uploadedAt: string | null;
  acknowledgedAt: string | null;
  /** Opens the private document; the page owns the shared viewer state. */
  onView: () => void;
  viewing: boolean;
  /** Re-reads the tenancy after the confirmation is saved. */
  onAcknowledged: () => void;
}

function leaseSummary(
  path: string | null,
  uploadedAt: string | null,
  acknowledgedAt: string | null,
): string {
  const status = signedLeaseStatus(path, acknowledgedAt);
  if (status === "missing") {
    return "The signed contract will appear here once your landlord uploads it.";
  }
  const uploaded = uploadedAt ? `Uploaded ${formatLeaseDate(uploadedAt)}` : "On file";
  if (status === "acknowledged" && acknowledgedAt) {
    return `You confirmed this lease on ${formatLeaseDate(acknowledgedAt)}.`;
  }
  return `${uploaded}. Open it and confirm it matches your agreement.`;
}

/** Tenant side of the executed contract: read it, then confirm it. */
export default function SignedLeaseCard({
  tenancyId,
  path,
  uploadedAt,
  acknowledgedAt,
  onView,
  viewing,
  onAcknowledged,
}: SignedLeaseCardProps) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const status = signedLeaseStatus(path, acknowledgedAt);

  const handleConfirm = async () => {
    setConfirming(true);
    setError(null);
    try {
      await acknowledgeSignedLease(tenancyId);
      onAcknowledged();
    } catch (err) {
      console.error("Signed lease confirmation failed", err);
      setError(err instanceof Error ? err.message : "Could not confirm the lease. Please try again.");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <DashboardCard>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900/50">
            <FileText size={20} className="text-teal-600 dark:text-teal-300" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="font-nunito text-sm font-semibold text-card-foreground">Signed lease</h2>
            <p className="mt-0.5 font-inter text-xs text-muted-foreground">
              {leaseSummary(path, uploadedAt, acknowledgedAt)}
            </p>
          </div>
        </div>
        {status === "missing" ? (
          <StatusChip variant="neutral">Not uploaded</StatusChip>
        ) : status === "pending" ? (
          <StatusChip variant="warning">Needs your confirmation</StatusChip>
        ) : (
          <StatusChip variant="success">Confirmed</StatusChip>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="outline"
          className="rounded-full"
          isDisabled={!path || viewing}
          onPress={onView}
        >
          <FileText size={16} />
          View document
        </Button>
        {status === "pending" && (
          <Button
            className="rounded-full"
            isPending={confirming}
            onPress={() => void handleConfirm()}
          >
            <ShieldCheck size={16} />
            I&apos;ve reviewed this lease
          </Button>
        )}
      </div>

      {error ? <ErrorBanner message={error} /> : null}
    </DashboardCard>
  );
}
