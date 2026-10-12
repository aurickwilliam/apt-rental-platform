import Link from "next/link";
import { IconInfoCircle } from "@tabler/icons-react";

/** Explains that there is no upload step: the APT Passport is attached. */
export default function PassportNotice() {
  return (
    <div className="flex gap-3 rounded-2xl border border-primary/30 bg-accent p-3">
      <IconInfoCircle size={20} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-card-foreground">Your APT Passport is submitted automatically</p>
        <p className="text-sm text-muted-foreground">
          Your ID and supporting documents are sent with your application, so there is nothing to upload. Keep them
          current in{" "}
          <Link href="/tenant/passport" className="font-medium text-primary hover:underline">
            APT Passport
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
