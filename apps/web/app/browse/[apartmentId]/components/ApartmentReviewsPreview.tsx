"use client";

import { useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import { Button, Card } from "@heroui/react";
import { MessageSquareText } from "lucide-react";

import ReviewCard from "./ReviewCard";
import { getApartmentReviews, type StoredReview } from "../lib/review-store";

interface ApartmentReviewsPreviewProps {
  apartmentId: string;
}

function formatReviewDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function EmptyReviewsState() {
  return (
    <Card className="flex min-h-[150px] items-center justify-center p-8 shadow-none border border-default-200">
      <div className="flex max-w-sm flex-col items-center text-center">
        <div className="mb-5 flex size-16 items-center justify-center rounded-full bg-secondary/10">
          <MessageSquareText className="size-8 text-secondary" />
        </div>

        <h3 className="text-lg font-semibold text-foreground">No reviews yet</h3>

        <p className="mt-2 text-sm text-default-500">
          This apartment hasn&apos;t received any reviews yet. Be the first to share your experience after
          your stay.
        </p>
      </div>
    </Card>
  );
}

export default function ApartmentReviewsPreview({ apartmentId }: ApartmentReviewsPreviewProps) {
  const router = useRouter();
  const [reviews, setReviews] = useState<StoredReview[]>([]);

  useEffect(() => {
    setReviews(getApartmentReviews(apartmentId));
  }, [apartmentId]);

  const sorted = useMemo(() => {
    return [...reviews].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [reviews]);

  if (sorted.length === 0) {
    return <EmptyReviewsState />;
  }

  const preview = sorted.slice(0, 3);
  const remaining = sorted.length - preview.length;

  return (
    <div>
      <div className="flex flex-col gap-3">
        {preview.map((review) => (
          <ReviewCard
            key={review.id}
            reviewerName="Anonymous Tenant"
            reviewDate={formatReviewDate(review.createdAt)}
            reviewText={review.reviewText}
            stayPeriod={review.stayPeriod}
            rating={review.rating}
          />
        ))}
      </div>

      {remaining > 0 && (
        <Card className="mt-3 flex flex-row items-center justify-between p-4 shadow-none border border-default-200">
          <p className="text-sm text-default-600">
            and {remaining} more review{remaining > 1 ? "s" : ""}
          </p>

          <Button size="sm" variant="ghost" onPress={() => router.push(`/browse/${apartmentId}/ratings`)}>
            See all reviews
          </Button>
        </Card>
      )}
    </div>
  );
}
