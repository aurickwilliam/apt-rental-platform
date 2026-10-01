"use client";

import { useState } from "react";

import { useParams } from "next/navigation";

import { Button, Card, Dropdown, Label, useOverlayState } from "@heroui/react";
import { ChevronDown, MessageSquareText } from "lucide-react";

import BackBtn from "./BackBtn";
import RateApartmentModal from "./RateApartmentModal";
import RatingBreakdown from "./RatingBreakdown";
import ReviewCard from "./ReviewCard";
import {
  useApartmentReviews,
  type ReviewSortOption,
} from "@/hooks/use-apartment-reviews";

const SORT_OPTIONS: ReviewSortOption[] = [
  "Most Recent",
  "Highest Rating",
  "Lowest Rating",
];

function formatReviewDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function ApartmentRatingsView({ basePath = "/browse" }: { basePath?: string }) {
  void basePath;
  const { apartmentId } = useParams<{ apartmentId: string }>();
  const reviewModal = useOverlayState();
  const [modalMode, setModalMode] = useState<{ tenancyId?: string | null; reviewId?: string | null }>({});

  const {
    loading,
    error,
    overallRating,
    totalReviews,
    ratingsCount,
    reviews,
    sortBy,
    setSortBy,
    canReview,
    canEdit,
    checkingEligibility,
    reviewableTenancyId,
    existingReview,
    refresh,
  } = useApartmentReviews(apartmentId);

  const countFor = (star: number) =>
    ratingsCount.find((bucket) => bucket.rating === star)?.ratingCount ?? 0;

  const showReviewButton = !checkingEligibility && canReview;
  const showEditButton = !checkingEligibility && canEdit;

  const handleWriteReview = () => {
    setModalMode({ tenancyId: reviewableTenancyId, reviewId: null });
    reviewModal.setOpen(true);
  };

  const handleEditReview = () => {
    setModalMode({ tenancyId: null, reviewId: existingReview?.id ?? null });
    reviewModal.setOpen(true);
  };

  if (loading) {
    return (
      <div className="w-full px-3 py-4 sm:px-4">
        <BackBtn />
        <div className="mt-4">
          <h1 className="text-2xl font-medium md:text-3xl">Ratings & Reviews</h1>
        </div>
        <p className="mt-6 text-sm text-default-500">Loading reviews…</p>
      </div>
    );
  }

  return (
    <div className="w-full px-3 py-4 sm:px-4">
      <BackBtn />

      <div className="mt-4">
        <h1 className="text-2xl font-medium md:text-3xl">Ratings & Reviews</h1>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {totalReviews > 0 && (
        <Card className="mt-6 p-6 md:p-8 shadow-none border border-default-200">
          <RatingBreakdown
            overallRate={overallRating}
            totalReviews={totalReviews}
            no5Star={countFor(5)}
            no4Star={countFor(4)}
            no3Star={countFor(3)}
            no2Star={countFor(2)}
            no1Star={countFor(1)}
          />
        </Card>
      )}

      <div className="mt-10 flex items-center justify-between gap-4">
        <h2 className="text-lg font-medium">Tenant Reviews</h2>

        <div className="flex items-center gap-3">
          {showReviewButton && (
            <Button size="sm" onPress={handleWriteReview}>
              Write a Review
            </Button>
          )}

          {showEditButton && (
            <Button size="sm" onPress={handleEditReview}>
              Edit Review
            </Button>
          )}

          {totalReviews > 0 && (
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

      {totalReviews === 0 ? (
        <Card className="mt-5 flex flex-col items-center gap-3 p-10 text-center shadow-none border border-default-200">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <MessageSquareText size={26} className="text-primary" />
          </div>

          <p className="text-base font-medium">
            No reviews yet. Be the first to share your experience!
          </p>

          {showReviewButton && <Button onPress={handleWriteReview}>Write a Review</Button>}
          {showEditButton && <Button onPress={handleEditReview}>Edit Review</Button>}
        </Card>
      ) : (
        <div className="mt-5 columns-1 gap-3 md:columns-2">
          {reviews.map((review) => (
            <div key={review.id} className="mb-3 break-inside-avoid">
              <ReviewCard
                reviewerName={review.name}
                reviewerAvatar={review.profilePictureUrl}
                reviewDate={formatReviewDate(review.date)}
                reviewText={review.review}
                stayPeriod={review.stayPeriod}
                rating={review.rating}
                images={review.images}
              />
            </div>
          ))}
        </div>
      )}

      <RateApartmentModal
        apartmentId={apartmentId}
        tenancyId={modalMode.tenancyId}
        reviewId={modalMode.reviewId}
        isOpen={reviewModal.isOpen}
        onOpenChange={reviewModal.setOpen}
        onSuccess={refresh}
      />
    </div>
  );
}
