"use client";

import Link from "next/link";

import { Button } from "@heroui/react";

import { RECOVERY_START_PATH } from "@repo/supabase/password-recovery";
import { passwordErrorMessage } from "@repo/utils";

import { useTranslation } from "@/app/components/i18n/LocaleProvider";
import RecoveryHeader from "./RecoveryHeader";

// Shown on the reset page once its recovery session is gone (expired, cancelled,
// or finished elsewhere). Rendered instead of a redirect: a server action that
// ends the session re-renders this page, and a redirect there would race the
// action's own navigation.
export default function RecoverySessionEnded() {
  const { language } = useTranslation();

  return (
    <div className="flex flex-1 flex-col">
      <RecoveryHeader
        title="Reset session ended"
        description={passwordErrorMessage(language, "session_expired")}
      />

      <Link href={RECOVERY_START_PATH} className="mt-[clamp(1.5rem,4vh,2rem)]">
        <Button size="lg" className="w-full cursor-pointer">
          Request a new code
        </Button>
      </Link>
      <Link href="/sign-in" className="mt-3">
        <Button size="lg" variant="ghost" className="w-full cursor-pointer">
          Back to Sign In
        </Button>
      </Link>
    </div>
  );
}
