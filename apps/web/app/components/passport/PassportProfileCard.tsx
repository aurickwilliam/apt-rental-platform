"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { Button, Card, buttonVariants } from "@heroui/react";
import { IconFileCheck, IconLock } from "@tabler/icons-react";

import { useTranslation } from "@/app/components/i18n/LocaleProvider";
import VerifyDialog from "@/app/verify/components/VerifyDialog";
import { preloadVerificationPageState } from "@/app/verify/components/verificationPageStateCache";

interface PassportProfileCardProps {
  /** Server-managed account status; the authoritative immediate state. */
  accountStatus: string | null | undefined;
  /** Route prefix for this portal's Passport, e.g. `/tenant/passport`. */
  basePath: string;
  /**
   * Secondary verification submission history, streamed in by the profile
   * page inside its own Suspense boundary. Never gates the card itself.
   */
  verificationSlot?: ReactNode;
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
  verificationSlot = null,
}: PassportProfileCardProps) {
  const { t } = useTranslation();
  const isVerified = accountStatus === "verified";
  const isPending = accountStatus === "pending";
  // The trigger keeps account_status in sync with the latest submission, so
  // the immediate card never waits for the secondary timeline query.
  const isRejected = !isVerified && !isPending && accountStatus === "rejected";
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
    ? t("passport.profile.verified")
    : isPending
      ? t("passport.profile.pending")
      : isRejected
        ? t("passport.profile.rejected")
        : t("passport.profile.unverified");

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
              <h2 className="font-nunito text-lg font-bold text-primary">{t("passport.title")}</h2>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>

          {isVerified ? (
            <Link href={basePath} className={buttonVariants({ variant: "primary", className: "w-full" })}>
              {t("passport.profile.open")}
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
              {isRejected ? t("passport.profile.reapply") : t("passport.profile.apply")}
            </Button>
          ) : null}

          {!isVerified ? verificationSlot : null}
        </Card.Content>
      </Card>
      <VerifyDialog open={verifyOpen} onClose={handleClose} />
    </>
  );
}
