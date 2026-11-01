"use client";

import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";

import { IconArrowLeft } from "@tabler/icons-react";

import { useTranslation } from "@/app/components/i18n/LocaleProvider";

export default function BackBtn() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <Button
      variant="outline"
      onPress={() => router.back()}
    >
      <IconArrowLeft size={18} />
      {t("apartment.back")}
    </Button>
  );
}
