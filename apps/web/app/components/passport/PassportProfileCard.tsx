import Link from "next/link";
import { Card, buttonVariants } from "@heroui/react";
import { IconFileCheck, IconLock } from "@tabler/icons-react";

interface PassportProfileCardProps {
  accountStatus: string | null | undefined;
  /** Route prefix for this portal's Passport, e.g. `/tenant/passport`. */
  basePath: string;
}

/**
 * Profile entry to the APT Passport. Only verified accounts can open it; the
 * card explains why it is locked and links to verification otherwise.
 */
export default function PassportProfileCard({ accountStatus, basePath }: PassportProfileCardProps) {
  const isVerified = accountStatus === "verified";
  const isPending = accountStatus === "pending";

  return (
    <Card className="rounded-2xl border border-border bg-card p-6 text-card-foreground">
      <Card.Content className="flex flex-col gap-4 p-0 sm:flex-row sm:items-center">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-primary">
          {isVerified ? <IconFileCheck size={22} aria-hidden="true" /> : <IconLock size={22} aria-hidden="true" />}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-nunito text-lg font-semibold">APT Passport</h2>
          <p className="text-sm text-muted-foreground">
            {isVerified
              ? "Keep your verified ID and supporting documents ready. They're attached automatically when you apply."
              : isPending
                ? "Your account verification is under review. Your APT Passport unlocks once it's approved."
                : "Verify your account to unlock your APT Passport. It's submitted with every rental application."}
          </p>
        </div>
        {isVerified ? (
          <Link href={basePath} className={buttonVariants({ variant: "primary" })}>
            Open Passport
          </Link>
        ) : !isPending ? (
          <Link href="/verify" className={buttonVariants({ variant: "outline" })}>
            Verify Account
          </Link>
        ) : null}
      </Card.Content>
    </Card>
  );
}
