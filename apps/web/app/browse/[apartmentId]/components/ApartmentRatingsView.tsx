"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

import { Button, Card, Dropdown, Label, useOverlayState } from "@heroui/react";
import {
  IconArrowLeft as ArrowLeft,
  IconChevronDown,
  IconLock,
  IconMessage,
  IconStar,
} from "@tabler/icons-react";

import RateApartmentModal from "./RateApartmentModal";
import RatingBreakdown from "./RatingBreakdown";
import RatingsListingCard from "./RatingsListingCard";
import RatingsPageSkeleton from "./RatingsPageSkeleton";
import ReviewCard from "./ReviewCard";
import {
  useApartmentReviews,
  type ReviewSortOption,
} from "@/hooks/use-apartment-reviews";
import {
  fetchRateApartmentHeader,
  type RateApartmentHeader,
} from "@/service/reviewsService";
import ErrorBanner from "@/app/components/display/ErrorBanner";
import { useTranslation } from "@/app/components/i18n/LocaleProvider";
import { formatDate, REVIEW_SORT_KEYS, enumLabel } from "@repo/i18n";

const SORT_OPTIONS: ReviewSortOption[] = [
  "Most Recent",
  "Highest Rating",
  "Lowest Rating",
];

export default function ApartmentRatingsView() {
  const { apartmentId } = useParams<{ apartmentId: string }>();
  const pathname = usePathname();
  const { language, t } = useTranslation();
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
    existingReview,
    refresh,
  } = useApartmentReviews(apartmentId);

  const countFor = (star: number) =>
    ratingsCount.find((bucket) => bucket.rating === star)?.ratingCount ?? 0;

  const [aptHeader, setAptHeader] = useState<RateApartmentHeader | null>(null);
  const [aptHeaderFailed, setAptHeaderFailed] = useState(false);

  useEffect(() => {
    if (!apartmentId) return;
    let cancelled = false;
    fetchRateApartmentHeader(apartmentId)
      .then((header) => {
        if (!cancelled) setAptHeader(header);
      })
      .catch(() => {
        if (!cancelled) setAptHeaderFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [apartmentId]);

  const aptAddress = aptHeader
    ? [aptHeader.street_address, aptHeader.barangay, aptHeader.city].filter(Boolean).join(", ")
    : "";

  const listingHref = `${pathname.startsWith("/tenant/") ? "/tenant/browse" : "/browse"}/${apartmentId}`;

  const showReviewButton = !checkingEligibility && canReview;
  const showEditButton = !checkingEligibility && canEdit;
  const showLockedHint = !checkingEligibility && stayLocked;
  const showHeaderAction = showReviewButton || showEditButton;

  const handleWriteReview = () => {
    setModalMode({ tenancyId: reviewableTenancyId, reviewId: null });
    reviewModal.setOpen(true);
  };

  const handleEditReview = () => {
    setModalMode({ tenancyId: null, reviewId: existingReview?.id ?? null });
    reviewModal.setOpen(true);
  };

  if (loading) {
    return <RatingsPageSkeleton />;
  }

  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <Link
            href={listingHref}
            className="inline-flex w-fit items-center gap-1.5 rounded-md text-sm text-muted-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            {t("reviews.backToListing")}
          </Link>

          <h1 className="mt-2 font-nunito text-2xl font-bold md:text-3xl">
            {t("reviews.title")}
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            {t("reviews.subtitle", { name: aptHeader?.name ?? t("reviews.subtitleFallback") })}
          </p>

          {showLockedHint && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <IconLock size={14} aria-hidden="true" />
              {t("reviews.locked")}
            </p>
          )}
        </div>

        {showHeaderAction && (
          <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto">
            {showReviewButton && (
              <Button className="w-full sm:w-auto" onPress={handleWriteReview}>
                {t("reviews.write")}
              </Button>
            )}
            {showEditButton && (
              <Button className="w-full sm:w-auto" onPress={handleEditReview}>
                {t("reviews.edit")}
              </Button>
            )}
          </div>
        )}
      </header>

      <div className="mt-6 grid min-w-0 items-start gap-4 lg:grid-cols-[20rem_minmax(0,1fr)] lg:gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
        <aside
          className="grid min-w-0 gap-4 md:grid-cols-2 lg:grid-cols-1"
          aria-label={t("reviews.summaryAria")}
        >
          {aptHeader ? (
            <RatingsListingCard
              name={aptHeader.name}
              status={aptHeader.status}
              address={aptAddress}
              landlordName={aptHeader.landlordName}
              type={aptHeader.type}
              coverImage={aptHeader.coverImage}
              listingHref={listingHref}
            />
          ) : aptHeaderFailed ? (
            <Card className="min-w-0 rounded-3xl border border-border bg-card p-4 shadow-none sm:p-5">
              <p className="text-sm text-muted-foreground">{t("reviews.detailsError")}</p>
            </Card>
          ) : (
            <Card className="min-w-0 rounded-3xl border border-border bg-card p-4 shadow-none sm:p-5">
              <p className="text-sm text-muted-foreground">{t("reviews.loadingDetails")}</p>
            </Card>
          )}

          {error ? null : totalReviews > 0 ? (
            <Card className="min-w-0 rounded-3xl border border-border bg-card p-4 shadow-none sm:p-5">
              <RatingBreakdown
                layout="stacked"
                overallRate={overallRating}
                totalReviews={totalReviews}
                no5Star={countFor(5)}
                no4Star={countFor(4)}
                no3Star={countFor(3)}
                no2Star={countFor(2)}
                no1Star={countFor(1)}
              />
            </Card>
          ) : (
            <Card className="min-w-0 rounded-3xl border border-border bg-card p-4 shadow-none sm:p-5">
              <div className="flex flex-col items-center gap-3 px-2 py-6 text-center">
                <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <IconStar size={28} aria-hidden="true" />
                </span>
                <div className="space-y-1">
                  <p className="font-nunito text-base font-semibold text-card-foreground">
                    {t("reviews.noneTitle")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("reviews.noneBody")}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </aside>

        <section className="flex min-w-0 flex-col gap-4" aria-labelledby="tenant-reviews-heading">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-baseline gap-2">
              <h2
                id="tenant-reviews-heading"
                className="font-nunito text-lg font-semibold"
              >
                {t("reviews.sectionTitle")}
              </h2>
              {totalReviews > 0 && (
                <span className="text-sm text-muted-foreground">
                  {totalReviews === 1 ? t("reviews.count", { count: totalReviews }) : t("reviews.countPlural", { count: totalReviews })}
                </span>
              )}
            </div>

            {totalReviews > 0 && (
              <Dropdown>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-full"
                  aria-label={t("reviews.sortAria", { sort: enumLabel(language, REVIEW_SORT_KEYS, sortBy) })}
                >
                  {enumLabel(language, REVIEW_SORT_KEYS, sortBy)}
                  <IconChevronDown size={16} aria-hidden="true" />
                </Button>

                <Dropdown.Popover>
                  <Dropdown.Menu
                    aria-label={t("reviews.sortMenuAria")}
                    selectionMode="single"
                    selectedKeys={new Set([sortBy])}
                    onAction={(key) => setSortBy(key as ReviewSortOption)}
                  >
                    {SORT_OPTIONS.map((option) => (
                      <Dropdown.Item key={option} id={option} textValue={option}>
                        <Dropdown.ItemIndicator />
                        <Label>{enumLabel(language, REVIEW_SORT_KEYS, option)}</Label>
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown.Popover>
              </Dropdown>
            )}
          </div>

          {error ? (
            <ErrorBanner message={error}>
              <Button size="sm" variant="outline" onPress={refresh}>
                {t("reviews.retry")}
              </Button>
            </ErrorBanner>
          ) : totalReviews === 0 ? (
            <Card className="rounded-3xl border border-border bg-card shadow-none">
              <Card.Content className="flex flex-col items-center gap-4 p-6 text-center sm:p-10">
                <span className="rounded-full bg-muted p-5">
                  <IconMessage size={36} className="text-muted-foreground" aria-hidden="true" />
                </span>
                <div className="space-y-1">
                  <p className="font-nunito text-lg font-bold">
                    {t("reviews.emptyTitle")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("reviews.emptyBody")}
                  </p>
                </div>

                {showReviewButton && <Button onPress={handleWriteReview}>{t("reviews.write")}</Button>}
                {showEditButton && <Button onPress={handleEditReview}>{t("reviews.edit")}</Button>}
              </Card.Content>
            </Card>
          ) : (
            <div className="flex min-w-0 flex-col gap-3">
              {reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  reviewerName={review.name}
                  reviewerAvatar={review.profilePictureUrl}
                  reviewDate={formatDate(review.date, "long", language)}
                  reviewText={review.review}
                  stayPeriod={review.stayPeriod}
                  rating={review.rating}
                  images={review.images}
                />
              ))}
            </div>
          )}
        </section>
      </div>

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
