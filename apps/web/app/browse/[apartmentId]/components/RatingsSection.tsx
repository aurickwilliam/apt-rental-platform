"use client";

import { useRouter } from "next/navigation";

import { Button } from "@heroui/react";

import RatingBreakdown from "./RatingBreakdown";
import { useApartmentReviews } from "@/hooks/use-apartment-reviews";

interface RatingSectionProps {
  apartmentId: string;
  basePath?: string;
}

export default function RatingSection({
  apartmentId,
  basePath = "/browse",
}: RatingSectionProps) {
  const router = useRouter();
  const { overallRating, totalReviews, ratingsCount, loading, error } =
    useApartmentReviews(apartmentId);

  const countFor = (star: number) =>
    ratingsCount.find((bucket) => bucket.rating === star)?.ratingCount ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-medium">Ratings & Reviews</h3>

        <Button
          size="sm"
          variant="ghost"
          onPress={() => router.push(`${basePath}/${apartmentId}/ratings`)}
          className="-mr-3 text-secondary dark:text-[#FFA500]"
        >
          See all reviews
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-default-500">Loading ratings…</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : (
        <RatingBreakdown
          overallRate={overallRating}
          totalReviews={totalReviews}
          no5Star={countFor(5)}
          no4Star={countFor(4)}
          no3Star={countFor(3)}
          no2Star={countFor(2)}
          no1Star={countFor(1)}
        />
      )}
    </div>
  );
}
