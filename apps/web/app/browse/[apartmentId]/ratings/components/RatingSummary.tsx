"use client";

import StarRating from "@/app/components/display/StarRating";

interface RatingSummaryProps {
  overallRate: number;
  totalReviews: number;
}

export default function RatingSummary({
  overallRate,
  totalReviews,
}: RatingSummaryProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 text-center">
      <p className="text-lg font-medium text-grey-700">Overall Rating</p>

      <p className="text-7xl font-dm-serif font-medium leading-tight text-secondary md:text-8xl">
        {overallRate.toFixed(1)}
      </p>

      <StarRating rating={overallRate} size={30} className="flex gap-2" />

      <p className="text-base font-medium text-grey-700">
        based on {totalReviews} {totalReviews === 1 ? "Review" : "Reviews"}
      </p>
    </div>
  );
}