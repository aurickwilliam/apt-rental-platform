import Link from "next/link";
import { redirect } from "next/navigation";
import { IconLock } from "@tabler/icons-react";

import { createClient } from "@repo/supabase/server";

interface SuspensionStatus {
  suspended?: boolean;
  reason?: string | null;
}

// A suspended account can still authenticate, so it lands here with a session.
// Database rules (RLS) are what actually block its data; this page explains why.
export default async function SuspendedPage() {
  const supabase = await createClient();
  const { data: status } = await supabase.rpc("get_my_suspension_status");
  const { suspended, reason } = (status ?? {}) as SuspensionStatus;

  if (!suspended) redirect("/");

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md space-y-4 rounded-3xl border border-border bg-card p-8 text-center">
        <IconLock className="mx-auto text-danger" size={40} aria-hidden="true" />
        <h1 className="font-nunito text-2xl font-bold text-foreground">Account suspended</h1>
        <p className="text-sm text-muted-foreground">
          Your account has been suspended and you can&apos;t use APT right now.
        </p>
        {reason ? (
          <div className="rounded-xl border border-border bg-background p-3 text-left">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Reason
            </p>
            <p className="mt-1 text-sm text-foreground wrap-break-word">{reason}</p>
          </div>
        ) : null}
        <p className="text-sm text-muted-foreground">
          Contact support if you think this is a mistake.
        </p>
        <Link
          href="/auth/sign-out"
          className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground"
        >
          Sign out
        </Link>
      </div>
    </main>
  );
}
