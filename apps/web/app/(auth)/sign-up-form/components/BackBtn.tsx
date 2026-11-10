"use client";

import { Link } from "@heroui/react";
import { IconArrowLeft } from "@tabler/icons-react";
import { useAuth } from "../../components/AuthContext";
import { useTranslation } from "@/app/components/i18n/LocaleProvider";

export default function BackBtn() {
  const { t } = useTranslation();
  const { role } = useAuth();

  return (
    <Link
      href={`/sign-up?role=${role}`}
      className="inline-flex cursor-pointer items-center gap-2 font-medium text-primary hover:decoration-primary"
    >
      <IconArrowLeft size={18} aria-hidden="true" />
      {t("common.back")}
    </Link>
  );
}
