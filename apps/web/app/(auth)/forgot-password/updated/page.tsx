import Link from "next/link";

import { Button } from "@heroui/react";
import { IconCircleCheck } from "@tabler/icons-react";

import { translate } from "@repo/i18n";

import { getServerLocale } from "@/lib/i18n/locale";

import RecoveryLayout from "../components/RecoveryLayout";

export const dynamic = "force-dynamic";

// Reached signed out: every session ended when the password changed.
export default async function PasswordUpdatedPage() {
  const language = await getServerLocale();
  return (
    <RecoveryLayout>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="rounded-full bg-primary/10 p-4">
          <IconCircleCheck size={40} className="text-primary" aria-hidden="true" />
        </div>

        <h1 className="mt-6 font-nunito font-semibold text-[clamp(1.75rem,5vw,2.5rem)] leading-tight text-foreground">
          {translate(language, "auth.changePassword.successTitle")}
        </h1>
        <p className="mt-[clamp(0.5rem,1.5vh,0.75rem)] text-base text-foreground">
          {translate(language, "auth.recovery.updatedBody")}
        </p>

        <Link href="/sign-in" className="mt-[clamp(1.5rem,4vh,2rem)] w-full">
          <Button size="lg" className="w-full cursor-pointer">
            {translate(language, "auth.backToSignIn")}
          </Button>
        </Link>
      </div>
    </RecoveryLayout>
  );
}
