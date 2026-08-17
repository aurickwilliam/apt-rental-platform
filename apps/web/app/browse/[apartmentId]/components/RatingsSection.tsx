"use client";

import { useRouter } from "next/navigation";

import { Button } from "@heroui/react";

import RatingBreakdown from "./RatingBreakdown";

interface RatingSectionProps {
  apartmentId: string;
  overallRate: number;
  totalReviews: number;
  no5Star: number;
  no4Star: number;
  no3Star: number;
  no2Star: number;
  no1Star: number;
}

export default function RatingSection({
  apartmentId,
  overallRate,
  totalReviews,
  no5Star,
  no4Star,
  no3Star,
  no2Star,
  no1Star
}: RatingSectionProps) {
  const router = useRouter();

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-medium">
          Ratings & Reviews
        </h3>

        <Button
          size="sm"
          variant="ghost"
          onPress={() => router.push(`/browse/${apartmentId}/ratings`)}
          className="-mr-3 text-secondary"
        >
          See all reviews
        </Button>
      </div>

      <RatingBreakdown
        overallRate={overallRate}
        totalReviews={totalReviews}
        no5Star={no5Star}
        no4Star={no4Star}
        no3Star={no3Star}
        no2Star={no2Star}
        no1Star={no1Star}
      />
    </div>
  );
}