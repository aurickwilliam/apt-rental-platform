"use client";

import { Link } from "@heroui/react";
import { useAuth } from './AuthContext';
import { useTranslation } from "@/app/components/i18n/LocaleProvider";

export default function BottomLinks() {
  const { t } = useTranslation();
  const { type } = useAuth();
  return (
    <>
      {
        type === 'sign-in' ? (
          <p>
            {t("auth.newHere")}{" "}
            <Link href="/sign-up" className="text-primary underline cursor-pointer">
              {t("auth.createAccount")}
            </Link>
          </p>
        ) : (
          <p>
            {t("auth.alreadyHaveAccount")}{" "}
            <Link href="/sign-in" className="text-primary underline cursor-pointer">
              {t("auth.signIn.action")}
            </Link>
          </p>
        )
      }
    </>
  );
}