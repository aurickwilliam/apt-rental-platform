"use client";

import { Meter } from "@heroui/react";

import { IconStarFilled } from "@tabler/icons-react";

import StarRating from "@/app/components/display/StarRating";
import { useTranslation } from "@/app/components/i18n/LocaleProvider";

interface RatingBreakdownProps {
  overallRate: number;
  totalReviews: number;
  no5Star: number;
  no4Star: number;
  no3Star: number;
  no2Star: number;
  no1Star: number;
  layout?: "responsive" | "stacked";
}

export default function RatingBreakdown({
  overallRate,
  totalReviews,
  no5Star,
  no4Star,
  no3Star,
  no2Star,
  no1Star,
  layout = "responsive",
}: RatingBreakdownProps) {
  const { t } = useTranslation();

  const reviewCountLabel = (count: number) =>
    count === 1 ? t("reviews.count", { count }) : t("reviews.countPlural", { count });

  return (
    <div className={`w-full flex flex-col gap-6 min-w-0 ${layout === "responsive" ? "sm:flex-row sm:gap-3" : ""}`}>
      <div className={`w-full flex flex-col items-center justify-center min-w-0 ${layout === "responsive" ? "sm:w-1/3" : ""}`}>
        <h3 className="font-nunito text-5xl font-bold text-rating sm:text-6xl">
          {overallRate}
        </h3>

        <StarRating
          rating={overallRate}
          size={22}
          className="mt-2 flex flex-wrap justify-center gap-2"
        />

        <div className="mt-2 text-center">
          <p className="text-sm text-muted-foreground">
            {totalReviews === 1
              ? t("reviews.basedOn", { count: totalReviews })
              : t("reviews.basedOnPlural", { count: totalReviews })}
          </p>
        </div>
      </div>

      <div className={`flex w-full flex-col justify-center gap-2 min-w-0 ${layout === "responsive" ? "sm:w-2/3" : ""}`}>
        {[
          { label: 5, count: no5Star },
          { label: 4, count: no4Star },
          { label: 3, count: no3Star },
          { label: 2, count: no2Star },
          { label: 1, count: no1Star },
        ].map(({ label, count }) => (
          <div key={label} className="flex gap-2 items-center min-w-0">
            <div className="flex items-center gap-1 w-8 shrink-0">
              <span className="text-sm font-medium text-card-foreground">{label}</span>
              <IconStarFilled size={14} className="text-rating" />
            </div>

            <Meter
              value={totalReviews > 0 ? (count / totalReviews) * 100 : 0}
              aria-label={`${label === 1 ? t("reviews.starLabel", { count: label }) : t("reviews.starLabelPlural", { count: label })}: ${totalReviews === 1 ? t("reviews.meterAria", { count, total: totalReviews }) : t("reviews.meterAriaPlural", { count, total: totalReviews })}`}
              className="flex-1 min-w-0"
              color="accent"
            >
              <Meter.Track>
                <Meter.Fill style={{ backgroundColor: "var(--color-rating)" }} />
              </Meter.Track>
            </Meter>

            <p className="w-16 shrink-0 text-right text-sm text-muted-foreground sm:w-20">
              {reviewCountLabel(count)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
