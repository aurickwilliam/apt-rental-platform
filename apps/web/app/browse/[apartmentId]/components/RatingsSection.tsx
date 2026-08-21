"use client";

import { useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import { Button } from "@heroui/react";

import RatingBreakdown from "./RatingBreakdown";
import { getApartmentReviews, type StoredReview } from "../lib/review-store";

function starCounts(reviews: StoredReview[]): Record<number, number> {
  const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  for (const review of reviews) {
    const rating = Math.round(review.rating);
    if (rating >= 1 && rating <= 5) counts[rating] += 1;
  }

  return counts;
}

interface RatingSectionProps {
  apartmentId: string;
}

export default function RatingSection({
  apartmentId,
}: RatingSectionProps) {
  const router = useRouter();
  const [reviews, setReviews] = useState<StoredReview[]>([]);

  useEffect(() => {
    setReviews(getApartmentReviews(apartmentId));
  }, [apartmentId]);

  const stats = useMemo(() => {
    const counts = starCounts(reviews);
    const total = reviews.length;
    const average =
      total > 0
        ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / total) * 10) / 10
        : 0;

    return { total, average, counts };
  }, [reviews]);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-medium">Ratings & Reviews</h3>

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
        overallRate={stats.average}
        totalReviews={stats.total}
        no5Star={stats.counts[5]}
        no4Star={stats.counts[4]}
        no3Star={stats.counts[3]}
        no2Star={stats.counts[2]}
        no1Star={stats.counts[1]}
      />
    </div>
  );
}