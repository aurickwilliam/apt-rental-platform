"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button, Card, buttonVariants } from "@heroui/react";
import { IconFileCheck, IconLock } from "@tabler/icons-react";

import VerificationActivityTimeline, {
  type VerificationActivityRow,
} from "@/app/components/passport/VerificationActivityTimeline";
import VerifyDialog from "@/app/verify/components/VerifyDialog";
import { preloadVerificationPageState } from "@/app/verify/components/verificationPageStateCache";

interface PassportProfileCardProps {
  accountStatus: string | null | undefined;
  /** Route prefix for this portal's Passport, e.g. `/tenant/passport`. */
  basePath: string;
  /** Latest verification submission, if the user ever submitted. */
  verification?: VerificationActivityRow | null;
}

/**
 * Unified APT Passport card for the profile sidebar. Merges the former
 * Verification Status card into the Passport entry so the same state is
 * never described twice: one title, one status-specific description, and
 * the progress timeline only when a submission exists. The header badge in
 * ProfileHeader stays the single compact status marker, which is why this
 * card carries no badge of its own.
 *
 * State, actions, and the VerifyDialog flow are unchanged from the former
 * Verification Status card — only the presentation is unified. Only
 * verified accounts can open the wallet.
 */
export default function PassportProfileCard({
  accountStatus,
  basePath,
  verification = null,
}: PassportProfileCardProps) {
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

  const description = isVerified
    ? "Your identity has been verified."
    : isPending
      ? "Your identity verification is under review."
      : isRejected
        ? "Verification unsuccessful. Review the result and resubmit."
        : "Verify your identity to get started.";

  return (
    <>
      <Card className="rounded-3xl border border-border bg-card p-4 text-card-foreground shadow-none sm:p-5">
        <Card.Content className="flex flex-col gap-4 p-0">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-primary">
              {isVerified ? (
                <IconFileCheck size={22} aria-hidden="true" />
              ) : (
                <IconLock size={22} aria-hidden="true" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-nunito text-lg font-bold text-primary">APT Passport</h2>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>

          {isVerified ? (
            <Link href={basePath} className={buttonVariants({ variant: "primary", className: "w-full" })}>
              Open Passport
            </Link>
          ) : null}
          {!isVerified && !isPending ? (
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
              {isRejected ? "Re-Apply for Verification" : "Apply for Verification"}
            </Button>
          ) : null}

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
