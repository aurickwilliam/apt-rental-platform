"use client";

import { Button } from "@heroui/react";
import { IconShare2 } from "@tabler/icons-react";

import { useTranslation } from "@/app/components/i18n/LocaleProvider";

export default function ShareBtn() {
  const { t } = useTranslation();

  return (
    <Button
      variant="tertiary"
      size="md"
      isIconOnly
      aria-label={t("apartment.share.aria")}
    >
      <IconShare2 size={20} />
    </Button>
  );
}
