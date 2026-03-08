"use client";

import { Progress, Button } from "@heroui/react"

import { Star } from "lucide-react";

interface RatingSectionProps {
  overallRate: number;
  totalReviews: number;
  no5Star: number;
  no4Star: number;
  no3Star: number;
  no2Star: number;
  no1Star: number;
}

export default function RatingSection({
  overallRate,
  totalReviews,
  no5Star,
  no4Star,
  no3Star,
  no2Star,
  no1Star
}: RatingSectionProps) {

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium mb-8">
          Ratings & Reviews
        </h3>

        <Button
          size="sm"
          variant="light"
          radius="full"
          color="secondary"
          onPress={() => {
            alert("SEE ALL REVIEWS");
          }}
          className="-mr-3"
        >
          See all reviews
        </Button>
      </div>

      <div className="w-full flex gap-3">
        <div className="w-1/3 flex flex-col items-center justify-center">
          <h3 className="text-6xl font-medium font-dm-serif text-secondary">
            {overallRate}
          </h3>

          <div className="flex gap-2 mt-2">
            {[1, 2, 3, 4, 5].map((i) => {
              const filled = overallRate >= i;
              const half = !filled && overallRate >= i - 0.5;

              return (
                <span key={i} className="relative inline-flex">
                  {/* Empty star (base) */}
                  <Star size={22} className="text-secondary" fill="transparent" />
                  {/* Filled overlay — full or half */}
                  {(filled || half) && (
                    <span
                      className={`absolute inset-0 overflow-hidden ${half ? "w-1/2" : "w-full"}`}
                    >
                      <Star size={22} className="text-secondary" fill="currentColor" />
                    </span>
                  )}
                </span>
              );
            })}
          </div>

          <div className="mt-2 text-center">
            <p className="font-medium">
              Overall Rating
            </p>

            <p className="text-sm">
              Based on {totalReviews} reviews
            </p>
          </div>
        </div>

        <div className="w-2/3 flex flex-col justify-center gap-2">
          {[
            { label: 5, count: no5Star },
            { label: 4, count: no4Star },
            { label: 3, count: no3Star },
            { label: 2, count: no2Star },
            { label: 1, count: no1Star },
          ].map(({ label, count }) => (
            <div key={label} className="flex gap-2 items-center">
              <div className="flex items-center gap-1 w-8 shrink-0">
                <span className="text-sm font-medium">{label}</span>
                <Star size={14} className="text-secondary" fill="currentColor" />
              </div>

              <Progress
                value={totalReviews > 0 ? (count / totalReviews) * 100 : 0}
                aria-label={`${label} Star`}
                className="flex-1"
                color="secondary"
              />

              <p className="text-sm w-20 shrink-0 text-right text-grey-700">
                {count} reviews
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
