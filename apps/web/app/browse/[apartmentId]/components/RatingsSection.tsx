"use client";

import { useRouter } from "next/navigation";

import RatingBreakdown from "./RatingBreakdown";
import RatingsHeader from "./RatingsHeader";
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
    useApartmentReviews(apartmentId, false);

  const countFor = (star: number) =>
    ratingsCount.find((bucket) => bucket.rating === star)?.ratingCount ?? 0;

  return (
    <div>
      <RatingsHeader onSeeAll={() => router.push(`${basePath}/${apartmentId}/ratings`)} />

      {loading ? (
        <p className="text-sm text-default-500">Loading ratings…</p>
      ) : !error ? (
        <RatingBreakdown
          overallRate={overallRating}
          totalReviews={totalReviews}
          no5Star={countFor(5)}
          no4Star={countFor(4)}
          no3Star={countFor(3)}
          no2Star={countFor(2)}
          no1Star={countFor(1)}
        />
      ) : null}
    </div>
  );
}
