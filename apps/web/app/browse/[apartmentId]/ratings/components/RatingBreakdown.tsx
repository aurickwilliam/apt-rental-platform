"use client";

import { Meter } from "@heroui/react";
import { Star } from "lucide-react";

interface RatingBarCountData {
  rating: number;
  ratingCount: number;
}

interface RatingBreakdownProps {
  ratingsCount: RatingBarCountData[];
  totalReviews: number;
}

export default function RatingBreakdown({
  ratingsCount,
  totalReviews,
}: RatingBreakdownProps) {
  return (
    <div className="flex flex-col gap-2">
      {ratingsCount.map(({ rating, ratingCount }) => {
        const filledPercentage =
          totalReviews > 0 ? (ratingCount / totalReviews) * 100 : 0;

        return (
          <div
            key={rating}
            className="flex items-center gap-3"
            aria-label={`${rating} star: ${ratingCount} of ${totalReviews} reviews`}
          >
            <div className="flex w-10 shrink-0 items-center gap-1">
              <span className="flex-1 text-center text-sm font-medium">
                {rating}
              </span>
              <Star size={16} className="text-secondary" fill="currentColor" />
            </div>

            <Meter
              size="lg"
              value={filledPercentage}
              aria-label={`${rating} star`}
              className="flex-1"
            >
              <Meter.Track
                className="rounded-full"
                style={{ backgroundColor: "var(--color-default, #E5E7EB)" }}
              >
                <Meter.Fill
                  className="rounded-full"
                  style={{ backgroundColor: "var(--color-secondary, #FFA500)" }}
                />
              </Meter.Track>
            </Meter>

            <div className="w-10 shrink-0 text-right">
              <span className="text-sm font-medium">{ratingCount}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}