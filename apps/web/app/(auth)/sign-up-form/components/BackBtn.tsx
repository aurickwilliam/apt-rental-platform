"use client";

import Link from "next/link";
import { Button } from "@heroui/react";
import { IconArrowLeft as ArrowLeft } from "@tabler/icons-react";
import { useAuth } from "../../components/AuthContext";
import { useTranslation } from "@/app/components/i18n/LocaleProvider";

export default function BackBtn() {
  const { t } = useTranslation();
  const { role } = useAuth();

  return (
    <Link href={`/sign-up?role=${role}`}>
      <Button variant="ghost" className="font-medium rounded-full">
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t("common.back")}
      </Button>
    </Link>
  );
}
