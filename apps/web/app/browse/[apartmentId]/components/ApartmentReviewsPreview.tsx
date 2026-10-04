"use client";

import { useRouter } from "next/navigation";

import { Button, Card } from "@heroui/react";
import { MessageSquareText } from "lucide-react";

import ReviewCard from "./ReviewCard";
import { useApartmentReviews } from "@/hooks/use-apartment-reviews";

interface ApartmentReviewsPreviewProps {
  apartmentId: string;
  basePath?: string;
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
        <div className="mb-5 flex size-16 items-center justify-center rounded-full bg-secondary/10 dark:bg-[#FFA500]/10">
          <MessageSquareText className="size-8 text-secondary dark:text-[#FFA500]" />
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

export default function ApartmentReviewsPreview({ apartmentId, basePath = "/browse" }: ApartmentReviewsPreviewProps) {
  const router = useRouter();
  const { reviews, loading, error } = useApartmentReviews(apartmentId);

  if (loading) return null;
  if (error || reviews.length === 0) {
    return <EmptyReviewsState />;
  }

  const preview = reviews.slice(0, 3);
  const remaining = reviews.length - preview.length;

  return (
    <div>
      <div className="flex flex-col gap-3">
        {preview.map((review) => (
          <ReviewCard
            key={review.id}
            reviewerName={review.name}
            reviewerAvatar={review.profilePictureUrl}
            reviewDate={formatReviewDate(review.date)}
            reviewText={review.review}
            stayPeriod={review.stayPeriod}
            rating={review.rating}
            images={review.images}
          />
        ))}
      </div>

      {remaining > 0 && (
        <Card className="mt-3 flex flex-row items-center justify-between p-4 shadow-none border border-default-200">
          <p className="text-sm text-default-600">
            and {remaining} more review{remaining > 1 ? "s" : ""}
          </p>

          <Button size="sm" variant="ghost" onPress={() => router.push(`${basePath}/${apartmentId}/ratings`)}>
            See all reviews
          </Button>
        </Card>
      )}
    </div>
  );
}
