"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@heroui/react";
import { IconFileText as FileText, IconShieldCheck as ShieldCheck } from "@tabler/icons-react";

import ErrorBanner from "@/app/components/display/ErrorBanner";
import { formatLeaseDate } from "@/app/tenant/payment/utils";
import { signedLeaseStatus } from "@/lib/signed-lease";
import { acknowledgeSignedLease } from "@/service/signedLeaseService";

import DashboardCard from "./DashboardCard";
import StatusChip from "@/app/components/display/StatusChip";

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
  onAcknowledged: () => Promise<boolean>;
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
  const [saved, setSaved] = useState(false);
  const busy = useRef(false);
  const submitted = useRef(false);
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);
  const status = signedLeaseStatus(path, acknowledgedAt);

  const handleConfirm = async () => {
    if (busy.current || submitted.current || status !== "pending") return;
    busy.current = true;
    setConfirming(true);
    setError(null);
    try {
      await acknowledgeSignedLease(tenancyId);
      if (!active.current) return;
      submitted.current = true;
      setSaved(true);
      if (!await onAcknowledged() && active.current) {
        setError("Your confirmation was saved, but rental details could not refresh. Please try refreshing again.");
      }
    } catch (err) {
      console.error("Signed lease confirmation failed", err);
      if (active.current) setError(submitted.current
        ? "Your confirmation was saved, but rental details could not refresh. Please try refreshing again."
        : err instanceof Error ? err.message : "Could not confirm the lease. Please try again.");
    } finally {
      busy.current = false;
      if (active.current) setConfirming(false);
    }
  };

  return (
    <DashboardCard>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 basis-64 items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900/50">
            <FileText size={20} className="text-teal-600 dark:text-teal-300" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="font-nunito text-sm font-semibold text-card-foreground">Signed lease</h2>
            <p className="mt-0.5 font-inter text-xs text-muted-foreground">
              {saved && !acknowledgedAt ? "Your confirmation was saved." : leaseSummary(path, uploadedAt, acknowledgedAt)}
            </p>
          </div>
        </div>
        {status === "missing" ? (
          <StatusChip className="font-nunito text-[11px] font-semibold" tone="neutral">Not uploaded</StatusChip>
        ) : status === "pending" && !saved ? (
          <StatusChip className="font-nunito text-[11px] font-semibold" tone="warning">Needs your confirmation</StatusChip>
        ) : (
          <StatusChip className="font-nunito text-[11px] font-semibold" tone="success">Confirmed</StatusChip>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-2 @min-[32rem]/dashboard:flex-row @min-[32rem]/dashboard:flex-wrap">
        <Button
          variant="outline"
          className="rounded-full"
          isDisabled={!path || viewing}
          onPress={onView}
        >
          <FileText size={16} />
          View document
        </Button>
        {status === "pending" && !saved && (
          <Button
            className="rounded-full"
            isPending={confirming}
            isDisabled={confirming}
            onPress={() => void handleConfirm()}
          >
            <ShieldCheck size={16} />
            I&apos;ve reviewed this lease
          </Button>
        )}
      </div>

      {error ? <ErrorBanner message={error} /> : null}
      {saved && error ? (
        <Button variant="outline" size="sm" isPending={confirming} isDisabled={confirming} onPress={() => {
          if (busy.current) return;
          busy.current = true;
          setConfirming(true);
          void onAcknowledged().then((ok) => { if (active.current && ok) setError(null); }).catch((error: unknown) => {
            console.error("Lease details refresh failed", error);
            if (active.current) setError("Your confirmation was saved, but rental details could not refresh. Please try refreshing again.");
          }).finally(() => {
            busy.current = false;
            if (active.current) setConfirming(false);
          });
        }}>Refresh lease details</Button>
      ) : null}
    </DashboardCard>
  );
}
