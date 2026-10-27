import { formatReviewStayLabel } from "@repo/utils";

import ReviewCard from "@/app/browse/[apartmentId]/components/ReviewCard";

import type { PublicProfileReview } from "./types";

interface PublicProfileReviewListProps {
  reviews: PublicProfileReview[];
  /** All of the landlord's reviews, which can exceed the ones loaded. */
  reviewCount: number;
}

const REVIEW_DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "Asia/Manila",
});

// Two columns from lg; each row is as tall as its tallest card (items-start keeps shorter cards
// at their own height instead of stretching them).
export default function PublicProfileReviewList({ reviews, reviewCount }: PublicProfileReviewListProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2">
        {reviews.map((review) => (
          <ReviewCard
            key={review.id}
            reviewerName={review.reviewerName}
            reviewerAvatar={review.reviewerAvatar}
            reviewDate={REVIEW_DATE_FORMAT.format(new Date(review.date))}
            reviewText={review.text}
            stayPeriod={formatReviewStayLabel(review.apartmentName, review.stayPeriod)}
            rating={review.rating}
            images={review.images}
          />
        ))}
      </div>

      {reviews.length < reviewCount ? (
        <p className="text-sm text-muted-foreground">
          Showing the {reviews.length} most recent {reviews.length === 1 ? "review" : "reviews"} of {reviewCount}.
        </p>
      ) : null}
    </div>
  );
}
