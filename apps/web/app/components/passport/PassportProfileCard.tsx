"use client";

import { useEffect, useRef, useState } from "react";

import Link from "next/link";
import { Button, Card, buttonVariants } from "@heroui/react";
import { IconFileCheck, IconLock } from "@tabler/icons-react";

import VerifyDialog from "@/app/verify/components/VerifyDialog";
import { preloadVerificationPageState } from "@/app/verify/components/verificationPageStateCache";
import VerificationActivityTimeline, {
  type VerificationActivityRow,
} from "./VerificationActivityTimeline";

interface PassportProfileCardProps {
  accountStatus: string | null | undefined;
  /** Route prefix for this portal's Passport, e.g. `/tenant/passport`. */
  basePath: string;
  /** Latest verification submission, if the user ever submitted. */
  verification?: VerificationActivityRow | null;
}

/**
 * Profile entry to the APT Passport. Only verified accounts can open it; the
 * card explains why it is locked and opens the verification modal otherwise.
 * Owns the shared VerifyDialog so the user never leaves the profile page.
 */
export default function PassportProfileCard({ accountStatus, basePath, verification = null }: PassportProfileCardProps) {
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
    if (!isVerified) preloadVerificationPageState();
  }, [isVerified]);

  const handleClose = () => {
    setVerifyOpen(false);
    // Return focus to the card's Verify Account button on dismiss.
    triggerRef.current?.focus();
  };

  return (
    <>
    <Card className="rounded-3xl border border-border bg-card p-4 text-card-foreground shadow-none sm:p-5">
      <Card.Content className="flex flex-col gap-4 p-0">
        <div className="flex flex-col gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-primary">
            {isVerified ? <IconFileCheck size={22} aria-hidden="true" /> : <IconLock size={22} aria-hidden="true" />}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-nunito text-lg font-bold text-primary">APT Passport</h2>
            <p className="text-sm text-muted-foreground">
              {isVerified
                ? "Identity verified · Passport ready"
                : isPending
                  ? "Your documents are awaiting review."
                  : isRejected
                    ? "Your verification wasn't approved. You can submit new documents."
                    : "Verify your identity to get started."}
            </p>
          </div>
          {isVerified ? (
            <Link href={basePath} className={buttonVariants({ variant: "primary", className: "w-full" })}>
              Open Passport
            </Link>
          ) : isPending ? null : (
            <Button
              ref={triggerRef}
              type="button"
              variant="primary"
              className="w-full"
              onPress={() => setVerifyOpen(true)}
              onHoverStart={preloadVerificationPageState}
              onFocus={preloadVerificationPageState}
            >
              {isRejected ? "Resubmit documents" : "Verify Account"}
            </Button>
          )}
        </div>
        {verification && !isVerified && (
          <>
            <div className="border-t border-border" aria-hidden="true" />
            <VerificationActivityTimeline row={verification} />
          </>
        )}
      </Card.Content>
    </Card>
    <VerifyDialog open={verifyOpen} onClose={handleClose} />
    </>
  );
}
