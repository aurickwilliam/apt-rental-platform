import Link from "next/link";
import { buttonVariants } from "@heroui/react";
import { IconShieldCheck } from "@tabler/icons-react";
import { getLandlordAccessState, LANDLORD_VERIFICATION_MESSAGE } from "@repo/utils";

interface LandlordVerificationWallProps {
  accountStatus: string | null | undefined;
}

const COPY = {
  pending: {
    title: "Your verification is under review",
    body: "Landlord tools open as soon as APT approves your account. You will be notified when the review is done.",
    action: "View verification status",
  },
  unverified: {
    title: "Verify your account to continue",
    body: "Posting listings, handling applications, tenants, payments and messages are available to verified landlords only.",
    action: "Verify my account",
  },
} as const;

/**
 * Shown in place of every landlord tool until the account is verified. The
 * database refuses the same actions, so this is explanation, not enforcement.
 */
export default function LandlordVerificationWall({ accountStatus }: LandlordVerificationWallProps) {
  const state = getLandlordAccessState(accountStatus);
  const copy = state === "pending" ? COPY.pending : COPY.unverified;

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
      <div
        role="status"
        className="flex w-full max-w-md flex-col items-center gap-4 rounded-3xl border border-border bg-card p-6 text-center text-card-foreground sm:p-8"
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <IconShieldCheck size={26} aria-hidden="true" />
        </span>
        <h1 className="text-lg font-semibold">{copy.title}</h1>
        <p className="text-sm text-muted-foreground">{copy.body}</p>
        <p className="sr-only">{LANDLORD_VERIFICATION_MESSAGE}</p>
        <Link
          href="/landlord/profile"
          className={`${buttonVariants({ variant: "primary" })} cursor-pointer`}
        >
          {copy.action}
        </Link>
      </div>
    </div>
  );
}
