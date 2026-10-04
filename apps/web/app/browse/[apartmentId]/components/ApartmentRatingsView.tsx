"use client";

import { useEffect, useState } from "react";

import Image from "next/image";
import { useParams } from "next/navigation";

import { Button, Card, Chip, Dropdown, Label, Separator, useOverlayState } from "@heroui/react";
import { IconCalendar, IconChevronDown, IconHome, IconMapPin, IconMessage, IconUser } from "@tabler/icons-react";

import BackBtn from "./BackBtn";
import RateApartmentModal from "./RateApartmentModal";
import RatingBreakdown from "./RatingBreakdown";
import ReviewCard from "./ReviewCard";
import {
  useApartmentReviews,
  type ReviewSortOption,
} from "@/hooks/use-apartment-reviews";
import {
  fetchRateApartmentHeader,
  fetchReviewTenancy,
  formatStayPeriod,
  type RateApartmentHeader,
} from "@/service/reviewsService";
import { statusChipStyle } from "@/app/admin/apartments/lib/apartment-display";

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

function formatApartmentStatus(status: string | null): string {
  return (status ?? "unknown").replace(/_/g, " ");
}

export default function ApartmentRatingsView() {
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
    stayLocked,
    checkingEligibility,
    reviewableTenancyId,
    lockedTenancyId,
    existingReview,
    refresh,
  } = useApartmentReviews(apartmentId);

  const countFor = (star: number) =>
    ratingsCount.find((bucket) => bucket.rating === star)?.ratingCount ?? 0;

  const [aptHeader, setAptHeader] = useState<RateApartmentHeader | null>(null);
  const [aptHeaderError, setAptHeaderError] = useState<string | null>(null);

  useEffect(() => {
    if (!apartmentId) return;
    let cancelled = false;
    fetchRateApartmentHeader(apartmentId)
      .then((header) => {
        if (!cancelled) setAptHeader(header);
      })
      .catch(() => {
        if (!cancelled) setAptHeaderError("We couldn't load this apartment's details.");
      });
    return () => {
      cancelled = true;
    };
  }, [apartmentId]);

  const aptAddress = aptHeader
    ? [aptHeader.street_address, aptHeader.barangay, aptHeader.city].filter(Boolean).join(", ")
    : "";

  const [stay, setStay] = useState<{ id: string; label: string } | null>(null);

  const viewerTenancyId = reviewableTenancyId ?? existingReview?.tenancyId ?? lockedTenancyId ?? null;

  useEffect(() => {
    if (!viewerTenancyId) return;
    let cancelled = false;
    const run = async () => {
      try {
        const lease = await fetchReviewTenancy(viewerTenancyId);
        if (cancelled) return;
        const label = formatStayPeriod(lease.lease_start, lease.lease_end);
        setStay(label ? { id: viewerTenancyId, label } : null);
      } catch {
        if (!cancelled) setStay(null);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [viewerTenancyId]);

  const stayLabel = stay && stay.id === viewerTenancyId ? stay.label : null;

  const aptStatusStyle = statusChipStyle(aptHeader?.status ?? "");

  const showReviewButton = !checkingEligibility && canReview;
  const showEditButton = !checkingEligibility && canEdit;
  const showLockedHint = !checkingEligibility && stayLocked;

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
          <h1 className="font-nunito text-2xl font-bold md:text-3xl">Ratings & Reviews</h1>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">Loading reviews…</p>
      </div>
    );
  }

  return (
    <div className="w-full px-3 py-4 sm:px-4">
      <BackBtn />

      <div className="mt-4">
        <h1 className="font-nunito text-2xl font-bold md:text-3xl">Ratings & Reviews</h1>
      </div>

      {aptHeaderError && <p className="mt-4 text-sm text-red-600">{aptHeaderError}</p>}

      {aptHeader ? (
        <Card className="mt-6 rounded-3xl border border-border bg-card p-4 shadow-none sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
            <div className="h-48 w-full shrink-0 overflow-hidden rounded-2xl sm:h-56 sm:w-[38%] lg:h-64">
              <Image
                src={aptHeader.coverImage ?? "/default/default-thumbnail.jpeg"}
                alt={aptHeader.name}
                width={1200}
                height={256}
                unoptimized
                className="size-full object-cover"
              />
            </div>

            <div className="flex min-w-0 flex-1 flex-col">
              {aptHeader.status && (
                <Chip
                  size="sm"
                  variant="soft"
                  color={aptStatusStyle.color}
                  className={[
                    "self-start capitalize",
                    aptStatusStyle.className,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <Chip.Label className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-current" />
                    {formatApartmentStatus(aptHeader.status)}
                  </Chip.Label>
                </Chip>
              )}

              <h2 className="mt-2 font-nunito text-2xl font-semibold text-card-foreground">
                {aptHeader.name}
              </h2>
              <p className="mt-1 flex items-center gap-1.5 text-base text-muted-foreground">
                <IconMapPin size={16} className="shrink-0" />
                {aptAddress}
              </p>

              <Separator className="my-4" />

              <div className="flex flex-col gap-3 lg:flex-row lg:gap-0 lg:divide-x lg:divide-border">
                <div className="flex items-start gap-2 lg:flex-1 lg:pr-4">
                  <IconUser size={18} className="mt-0.5 shrink-0 text-muted-foreground" />
                  <div className="flex flex-col">
                    <Label className="text-sm font-medium text-muted-foreground">Landlord</Label>
                    <span className="text-base font-medium text-card-foreground">
                      {aptHeader.landlordName}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2 lg:flex-1 lg:px-4">
                  <IconHome size={18} className="mt-0.5 shrink-0 text-muted-foreground" />
                  <div className="flex flex-col">
                    <Label className="text-sm font-medium text-muted-foreground">Apartment Type</Label>
                    <span className="text-base font-medium text-card-foreground">
                      {aptHeader.type ?? "—"}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2 lg:flex-1 lg:pl-4">
                  <IconCalendar size={18} className="mt-0.5 shrink-0 text-muted-foreground" />
                  <div className="flex flex-col">
                    <Label className="text-sm font-medium text-muted-foreground">Duration of Stay</Label>
                    <span className="text-base font-medium text-card-foreground">
                      {stayLabel ?? "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        !aptHeaderError && (
          <p className="mt-4 text-sm text-muted-foreground">Loading apartment details…</p>
        )
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {totalReviews > 0 && (
        <Card className="mt-6 rounded-3xl border border-border bg-card p-4 shadow-none sm:p-5">
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

      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <h2 className="font-nunito text-lg font-semibold">Tenant Reviews</h2>

        <div className="flex flex-wrap items-center gap-3">
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

          {showLockedHint && (
            <p className="text-xs text-muted-foreground">
              Reviews unlock after 3 months of stay.
            </p>
          )}

          {totalReviews > 0 && (
            <Dropdown>
              <Button variant="outline" size="sm" className="h-9 rounded-full">
                {sortBy}
                <IconChevronDown size={16} />
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
        <Card className="mt-5 rounded-3xl border border-border bg-card shadow-none">
          <Card.Content className="flex flex-col items-center gap-4 p-6 text-center sm:p-10">
            <span className="rounded-full bg-muted p-5">
              <IconMessage size={36} className="text-muted-foreground" />
            </span>
            <div className="space-y-1">
              <p className="font-nunito text-lg font-bold">
                No reviews yet. Be the first to share your experience!
              </p>
              <p className="text-sm text-muted-foreground">
                Your review helps other tenants find their place to thrive.
              </p>
            </div>

            {showReviewButton && <Button onPress={handleWriteReview}>Write a Review</Button>}
            {showEditButton && <Button onPress={handleEditReview}>Edit Review</Button>}
          </Card.Content>
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
