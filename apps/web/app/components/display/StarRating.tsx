"use client";

import { IconStar, IconStarFilled } from "@tabler/icons-react";

interface StarRatingProps {
  rating: number;
  size?: number;
  maxStars?: number;
  className?: string;
}

export default function StarRating({
  rating,
  size = 16,
  maxStars = 5,
  className = "flex gap-1",
}: StarRatingProps) {
  const clampedRating = Math.max(0, Math.min(rating, maxStars));

  return (
    <div
      className={className}
      role="img"
      aria-label={`${clampedRating.toFixed(1)} out of ${maxStars} stars`}
    >
      {Array.from({ length: maxStars }, (_, i) => i + 1).map((star) => {
        const diff = clampedRating - star + 1;
        const filled = diff >= 1;
        const half = !filled && diff >= 0.5;

        return (
          <span key={star} className="relative inline-flex">
            <IconStar size={size} className="text-rating" />
            {(filled || half) && (
              <span
                className={`absolute inset-0 overflow-hidden ${half ? "w-1/2" : "w-full"}`}
              >
                <IconStarFilled size={size} className="text-rating" />
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}