import Link from "next/link";
import { Card, buttonVariants } from "@heroui/react";
import { IconFileCheck, IconLock } from "@tabler/icons-react";

interface PassportProfileCardProps {
  accountStatus: string | null | undefined;
  /** Route prefix for this portal's Passport, e.g. `/tenant/passport`. */
  basePath: string;
}

/**
 * Profile entry to the APT Passport. Only verified accounts can open it;
 * everyone else sees it locked. Verification itself lives in
 * VerificationStatusCard, which sits above this card.
 */
export default function PassportProfileCard({ accountStatus, basePath }: PassportProfileCardProps) {
  const isVerified = accountStatus === "verified";

  return (
    <Card className="rounded-3xl border border-border bg-card p-4 text-card-foreground shadow-none sm:p-5">
      <Card.Content className="flex flex-col gap-4 p-0">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-primary">
            {isVerified ? <IconFileCheck size={22} aria-hidden="true" /> : <IconLock size={22} aria-hidden="true" />}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-nunito text-lg font-bold text-primary">APT Passport</h2>
            <p className="text-sm text-muted-foreground">
              {isVerified ? "Identity verified · Passport ready" : "Verify your account to unlock"}
            </p>
          </div>
        </div>
        {isVerified ? (
          <Link href={basePath} className={buttonVariants({ variant: "primary", className: "w-full" })}>
            Open Passport
          </Link>
        ) : null}
      </Card.Content>
    </Card>
  );
}
