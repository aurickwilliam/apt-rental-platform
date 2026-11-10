"use client";

import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";

import { IconArrowLeft } from "@tabler/icons-react";

import { useTranslation } from "@/app/components/i18n/LocaleProvider";

interface BackBtnProps {
  fallbackHref?: string;
}

export default function BackBtn({ fallbackHref }: BackBtnProps = {}) {
  const router = useRouter();
  const { t } = useTranslation();

  const goBack = () => {
    if (!fallbackHref) {
      router.back();
      return;
    }

    // The Navigation API knows SPA history too. On older browsers, use a
    // same-origin referrer; a direct/external visit falls back inside APT.
    const navigation = (window as Window & {
      navigation?: { currentEntry?: { index: number }; entries: () => { url?: string }[] };
    }).navigation;
    const previousUrl = navigation
      ? navigation.entries()[(navigation.currentEntry?.index ?? 0) - 1]?.url
      : document.referrer;
    if (window.history.length > 1 && previousUrl
      && new URL(previousUrl, window.location.href).origin === window.location.origin) {
      router.back();
    } else {
      router.replace(fallbackHref);
    }
  };

  return (
    <Button
      variant="outline"
      type="button"
      onPress={goBack}
    >
      <IconArrowLeft size={18} aria-hidden="true" />
      {t("apartment.back")}
    </Button>
  );
}
