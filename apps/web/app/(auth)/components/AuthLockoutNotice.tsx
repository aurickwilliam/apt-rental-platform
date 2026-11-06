import { IconLock } from "@tabler/icons-react";
import { AUTH_LOCKOUT_TITLE, formatLockoutClock, lockoutDescription } from "@repo/utils";

// The same lock message as AuthLockoutModal, inline, for code steps that already
// sit inside a modal (sign-up and confirm-email codes). Danger card per DESIGN.md.
export default function AuthLockoutNotice({ secondsLeft }: { secondsLeft: number }) {
  return (
    <div role="alert" className="w-full rounded-2xl border border-danger/20 bg-danger/10 p-3 text-center">
      <div className="flex items-center justify-center gap-2 text-danger">
        <IconLock size={18} aria-hidden="true" />
        <span className="text-sm font-semibold">{AUTH_LOCKOUT_TITLE}</span>
      </div>
      <p className="mt-1 text-sm text-foreground">{lockoutDescription(secondsLeft)}</p>
      <p className="mt-1 text-sm text-foreground">
        Try again in{" "}
        <span className="font-semibold tabular-nums" role="timer" aria-live="off">
          {formatLockoutClock(secondsLeft)}
        </span>
      </p>
    </div>
  );
}
