"use client";

import { Meter } from "@heroui/react";

import { IconStar, IconStarFilled } from "@tabler/icons-react";

interface RatingBreakdownProps {
  overallRate: number;
  totalReviews: number;
  no5Star: number;
  no4Star: number;
  no3Star: number;
  no2Star: number;
  no1Star: number;
}

export default function RatingBreakdown({
  overallRate,
  totalReviews,
  no5Star,
  no4Star,
  no3Star,
  no2Star,
  no1Star,
}: RatingBreakdownProps) {
  return (
    <div className="w-full flex flex-col gap-6 sm:flex-row sm:gap-3">
      <div className="w-full flex flex-col items-center justify-center sm:w-1/3">
        <h3 className="font-nunito text-5xl font-bold text-rating sm:text-6xl">
          {overallRate}
        </h3>

        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {[1, 2, 3, 4, 5].map((i) => {
            const filled = overallRate >= i;
            const half = !filled && overallRate >= i - 0.5;

            return (
              <span key={i} className="relative inline-flex">
                {/* Empty star (base) */}
                <IconStar size={22} className="text-rating" />
                {/* Filled overlay — full or half */}
                {(filled || half) && (
                  <span
                    className={`absolute inset-0 overflow-hidden ${half ? "w-1/2" : "w-full"}`}
                  >
                    <IconStarFilled size={22} className="text-rating" />
                  </span>
                )}
              </span>
            );
          })}
        </div>

        <div className="mt-2 text-center">
          <p className="font-nunito text-base font-semibold text-card-foreground">
            Overall Rating
          </p>

          <p className="text-sm text-muted-foreground">
            Based on {totalReviews} reviews
          </p>
        </div>
      </div>

      <div className="flex w-full flex-col justify-center gap-2 sm:w-2/3">
        {[
          { label: 5, count: no5Star },
          { label: 4, count: no4Star },
          { label: 3, count: no3Star },
          { label: 2, count: no2Star },
          { label: 1, count: no1Star },
        ].map(({ label, count }) => (
          <div key={label} className="flex gap-2 items-center">
            <div className="flex items-center gap-1 w-8 shrink-0">
              <span className="text-sm font-medium text-card-foreground">{label}</span>
              <IconStarFilled size={14} className="text-rating" />
            </div>

            <Meter
              value={totalReviews > 0 ? (count / totalReviews) * 100 : 0}
              aria-label={`${label} Star`}
              className="flex-1"
              color="accent"
            >
              <Meter.Track>
                <Meter.Fill style={{ backgroundColor: "var(--color-rating)" }} />
              </Meter.Track>
            </Meter>

            <p className="w-16 shrink-0 text-right text-sm text-muted-foreground sm:w-20">
              {count} reviews
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}