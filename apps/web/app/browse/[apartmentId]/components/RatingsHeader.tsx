"use client";

import { Button } from "@heroui/react";

import { useTranslation } from "@/app/components/i18n/LocaleProvider";

interface RatingsHeaderProps {
  /** Omit when there is nothing more to open; the button is hidden. */
  onSeeAll?: () => void;
  /** Button text; the profile names the count, the apartment page stays generic. */
  seeAllLabel?: string;
  /** Heading level, so the same header fits pages whose sections use h2. */
  headingLevel?: "h2" | "h3";
}

// The "Ratings & Reviews" row shared by the apartment page and the landlord profile.
export default function RatingsHeader({
  onSeeAll,
  seeAllLabel,
  headingLevel: Heading = "h3",
}: RatingsHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between mb-5">
      <Heading className="font-nunito text-lg font-semibold">{t("reviews.title")}</Heading>

      {onSeeAll ? (
        <Button size="sm" variant="ghost" onPress={onSeeAll} className="-mr-3 text-brand">
          {seeAllLabel ?? t("reviews.seeAll")}
        </Button>
      ) : null}
    </div>
  );
}
