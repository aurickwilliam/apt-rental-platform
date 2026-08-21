"use client";

import { useEffect, useMemo, useState } from "react";

import { useParams, useRouter } from "next/navigation";

import { Button, Card, Dropdown, Label } from "@heroui/react";
import { ChevronDown, MessageSquareText } from "lucide-react";

import BackBtn from "../components/BackBtn";
import RatingBreakdown from "../components/RatingBreakdown";
import ReviewCard from "../components/ReviewCard";
import { getApartmentReviews, type StoredReview } from "../lib/review-store";

type ReviewSortOption = "Most Recent" | "Highest Rating" | "Lowest Rating";

const SORT_OPTIONS: ReviewSortOption[] = [
  "Most Recent",
  "Highest Rating",
  "Lowest Rating",
];

const REVIEWER_NAME = "Anonymous Tenant";

function formatReviewDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function starCounts(reviews: StoredReview[]): Record<number, number> {
  const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  for (const review of reviews) {
    const rating = Math.round(review.rating);
    if (rating >= 1 && rating <= 5) counts[rating] += 1;
  }

  return counts;
}

export default function RatingsPage() {
  const router = useRouter();
  const { apartmentId } = useParams<{ apartmentId: string }>();

  const [sortBy, setSortBy] = useState<ReviewSortOption>("Most Recent");
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

  const sortedReviews = useMemo(() => {
    const list = [...reviews];

    switch (sortBy) {
      case "Highest Rating":
        return list.sort((a, b) => b.rating - a.rating);
      case "Lowest Rating":
        return list.sort((a, b) => a.rating - b.rating);
      default:
        return list.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
  }, [reviews, sortBy]);

  const handleWriteReview = () =>
    router.push(`/browse/${apartmentId}/rate-apartment`);

  return (
    <div className="mx-auto max-w-7xl p-4">
      <BackBtn />

      <div className="mt-4">
        <h1 className="text-2xl font-medium md:text-3xl">Ratings & Reviews</h1>
      </div>

      {stats.total > 0 && (
        <Card className="mt-6 p-6 md:p-8 shadow-none border border-default-200">
          <RatingBreakdown
            overallRate={stats.average}
            totalReviews={stats.total}
            no5Star={stats.counts[5]}
            no4Star={stats.counts[4]}
            no3Star={stats.counts[3]}
            no2Star={stats.counts[2]}
            no1Star={stats.counts[1]}
          />
        </Card>
      )}

      <div className="mt-10 flex items-center justify-between gap-4">
        <h2 className="text-lg font-medium">Tenant Reviews</h2>

        <div className="flex items-center gap-3">
          <Button size="sm" onPress={handleWriteReview}>
            Write a Review
          </Button>

          {stats.total > 0 && (
            <Dropdown>
              <Button variant="outline" size="sm" className="h-9 rounded-full">
                {sortBy}
                <ChevronDown size={16} />
              </Button>

              <Dropdown.Popover>
                <Dropdown.Menu
                  selectionMode="single"
                  selectedKeys={new Set([sortBy])}
                  onAction={(key) => setSortBy(key as ReviewSortOption)}
                >
                  {SORT_OPTIONS.map((option) => (
                    <Dropdown.Item key={option} id={option} textValue={option}>
                      <Dropdown.ItemIndicator />
                      <Label>{option}</Label>
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
          )}
        </div>
      </div>

      {stats.total === 0 ? (
        <Card className="mt-5 flex flex-col items-center gap-3 p-10 text-center shadow-none border border-default-200">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <MessageSquareText size={26} className="text-primary" />
          </div>

          <p className="text-base font-medium">
            No reviews yet. Be the first to share your experience!
          </p>

          <Button onPress={handleWriteReview}>Write a Review</Button>
        </Card>
      ) : (
        <div className="mt-5 columns-1 gap-3 md:columns-2">
          {sortedReviews.map((review) => (
            <div key={review.id} className="mb-3 break-inside-avoid">
              <ReviewCard
                reviewerName={REVIEWER_NAME}
                reviewDate={formatReviewDate(review.createdAt)}
                reviewText={review.reviewText}
                stayPeriod={review.stayPeriod}
                rating={review.rating}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}