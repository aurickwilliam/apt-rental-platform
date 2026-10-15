"use client";

import { useEffect, useRef, useState } from "react";

import { Button, Card } from "@heroui/react";
import {
  IconAlertCircle,
  IconCamera,
  IconCircleCheck,
  IconCircleX,
  IconId,
} from "@tabler/icons-react";

import VerificationActivityTimeline, {
  type VerificationActivityRow,
} from "@/app/components/passport/VerificationActivityTimeline";
import VerifyDialog from "@/app/verify/components/VerifyDialog";
import { preloadVerificationPageState } from "@/app/verify/components/verificationPageStateCache";

interface VerificationStatusCardProps {
  accountStatus: string | null | undefined;
  role: "tenant" | "landlord";
  /** Latest verification submission, if the user ever submitted. */
  verification?: VerificationActivityRow | null;
}

/**
 * Own-profile verification status, mirroring the mobile profile card. Owns the
 * shared VerifyDialog so the user never leaves the profile page.
 */
export default function VerificationStatusCard({
  accountStatus,
  role,
  verification = null,
}: VerificationStatusCardProps) {
  const isVerified = accountStatus === "verified";
  const isPending = accountStatus === "pending";
  // Rejected derives from the latest submission record first (the trigger
  // keeps account_status in sync, so it doubles as a safe fallback).
  const isRejected =
    !isVerified &&
    !isPending &&
    (verification?.status === "rejected" || accountStatus === "rejected");
  const [verifyOpen, setVerifyOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Warm the modal's entry state while the user reads the page, so the
  // dialog can paint instantly on open instead of fetching then.
  useEffect(() => {
    if (!isVerified && !isPending) preloadVerificationPageState();
  }, [isVerified, isPending]);

  const handleClose = () => {
    setVerifyOpen(false);
    // Return focus to the card's button on dismiss.
    triggerRef.current?.focus();
  };

  const status = isVerified
    ? {
        label: `Verified ${role === "tenant" ? "Tenant" : "Landlord"}`,
        Icon: IconCircleCheck,
        tone: "text-success",
      }
    : isPending
      ? { label: "Pending Verification", Icon: IconAlertCircle, tone: "text-warning" }
      : isRejected
        ? { label: "Rejected", Icon: IconCircleX, tone: "text-danger" }
        : { label: "Not Verified", Icon: IconAlertCircle, tone: "text-muted-foreground" };
  const StatusIcon = status.Icon;

  return (
    <>
      <Card className="rounded-3xl border border-border bg-card p-4 text-card-foreground shadow-none sm:p-5">
        <Card.Content className="flex flex-col gap-3 p-0">
          <h2 className="flex items-center gap-2 font-nunito text-lg font-bold text-primary">
            <IconId size={20} className="shrink-0" aria-hidden="true" />
            Verification Status
          </h2>

          <p className={`flex items-center gap-2 font-nunito text-lg font-semibold ${status.tone}`}>
            <StatusIcon size={24} className="shrink-0" aria-hidden="true" />
            {status.label}
          </p>

          {isVerified ? (
            <p className="text-sm text-muted-foreground">
              {role === "tenant"
                ? "You have successfully been verified as a tenant. You can now apply for rental properties on our platform."
                : "You have successfully been verified as a landlord. You can now list and manage rental properties on our platform."}
            </p>
          ) : isPending ? (
            <p className="text-sm text-muted-foreground">
              Your documents are currently under review. We will notify you once the
              verification process is complete.
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {isRejected
                  ? "Your verification wasn't approved. You can submit new documents."
                  : "Your account has not been verified yet. Please submit your documents to get verified."}
              </p>
              <Button
                ref={triggerRef}
                type="button"
                variant="primary"
                size="sm"
                className="w-full"
                onPress={() => setVerifyOpen(true)}
                onHoverStart={preloadVerificationPageState}
                onFocus={preloadVerificationPageState}
              >
                <IconCamera size={16} aria-hidden="true" />
                {isRejected ? "Re-Apply for Verification" : "Apply for Verification"}
              </Button>
            </>
          )}

          {verification && !isVerified ? (
            <>
              <div className="border-t border-border" aria-hidden="true" />
              <VerificationActivityTimeline row={verification} />
            </>
          ) : null}
        </Card.Content>
      </Card>
      <VerifyDialog open={verifyOpen} onClose={handleClose} />
    </>
  );
}
