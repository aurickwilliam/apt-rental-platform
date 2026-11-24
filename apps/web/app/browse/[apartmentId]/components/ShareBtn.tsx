"use client";

import { Button, toast } from "@heroui/react";
import { IconShare2 } from "@tabler/icons-react";
import { buildApartmentShareText, getApartmentSharePath } from "@repo/utils";
import { useTranslation } from "@/app/components/i18n/LocaleProvider";

interface ShareBtnProps {
  apartmentId: string;
  name?: string | null;
  city?: string | null;
  monthlyRent?: number | null;
}

export default function ShareBtn({
  apartmentId,
  name,
  city,
  monthlyRent,
}: ShareBtnProps) {
  const { t } = useTranslation();

  const handleShare = async () => {
    // Always the public listing link, even when opened from a portal route.
    const url = `${window.location.origin}${getApartmentSharePath(apartmentId)}`;
    const text = buildApartmentShareText({
      id: apartmentId,
      name,
      city,
      monthly_rent: monthlyRent,
    });

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: name?.trim() || "APT", text, url });
      } catch (error) {
        // Closing the share sheet is not an error.
        if (error instanceof DOMException && error.name === "AbortError") return;
        toast.danger("Unable to share this apartment");
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.danger("Unable to copy the link");
    }
  };

  return (
    <Button
      variant="tertiary"
      size="md"
      isIconOnly
      className="cursor-pointer"
      aria-label={t("apartment.share.aria")}
      onPress={handleShare}
    >
      <IconShare2 size={20} />
    </Button>
  );
}
