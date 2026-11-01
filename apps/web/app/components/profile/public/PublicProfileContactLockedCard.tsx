import Link from "next/link";

import { buttonVariants } from "@heroui/react";
import { IconLock } from "@tabler/icons-react";

interface PublicProfileContactLockedCardProps {
  /** First name of the profile owner. */
  displayName: string;
}

// Signed-out visitors still see who the landlord is, but contact details stay
// behind an account. Replaces an empty side column with a way forward.
export default function PublicProfileContactLockedCard({ displayName }: PublicProfileContactLockedCardProps) {
  return (
    <section
      aria-label="Contact information"
      className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-4 sm:p-5"
    >
      <div className="flex items-center gap-2">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <IconLock size={18} aria-hidden="true" />
        </span>
        <h2 className="font-nunito text-base font-bold">Contact {displayName}</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Sign in to see {displayName}&apos;s phone number and email, and send a message.
      </p>
      <Link href="/sign-in" className={buttonVariants({ variant: "primary", fullWidth: true })}>
        Sign in
      </Link>
      <Link href="/sign-up" className={buttonVariants({ variant: "tertiary", fullWidth: true })}>
        Create an account
      </Link>
    </section>
  );
}
