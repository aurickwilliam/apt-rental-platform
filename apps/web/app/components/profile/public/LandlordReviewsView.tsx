"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { buttonVariants } from "@heroui/react";
import { IconMessage, IconStarFilled } from "@tabler/icons-react";

import BackBtn from "@/app/browse/[apartmentId]/components/BackBtn";
import RatingBreakdown from "@/app/browse/[apartmentId]/components/RatingBreakdown";
import SettingsSelect from "@/app/components/settings/SettingsSelect";
import StarRating from "@/app/components/display/StarRating";
import {
  PROFILE_REVIEW_SORT_LABELS,
  PROFILE_REVIEWS_PAGE_SIZE,
  landlordProfileHref,
  landlordReviewsHref,
  memberSinceYear,
  parseProfileReviewSort,
  type ProfileReviewSort,
} from "@/lib/public-profile";

import PublicProfileEmptyState from "./PublicProfileEmptyState";
import PublicProfileHeader from "./PublicProfileHeader";
import PublicProfileLayout from "./PublicProfileLayout";
import PublicProfileReviewList from "./PublicProfileReviewList";
import PublicProfileSection from "./PublicProfileSection";
import PublicProfileStats from "./PublicProfileStats";
import type { LandlordReviewsPageData } from "./types";

interface LandlordReviewsViewProps {
  data: LandlordReviewsPageData;
  /** Which shell the page renders in; decides where the profile link goes. */
  portal: "public" | "tenant";
}

const SORT_OPTIONS = (Object.keys(PROFILE_REVIEW_SORT_LABELS) as ProfileReviewSort[]).map((value) => ({
  value,
  label: PROFILE_REVIEW_SORT_LABELS[value],
}));

const DISABLED_PAGE_LINK = `${buttonVariants({ variant: "tertiary" })} pointer-events-none opacity-50`;

export default function LandlordReviewsView({ data, portal }: LandlordReviewsViewProps) {
  const router = useRouter();
  const {
    identity,
    averageRating,
    reviewCount,
    ratingDistribution,
    reviews,
    totalCount,
    page,
    pageCount,
    sort,
  } = data;

  const firstName = identity.displayName.split(" ")[0] || "Landlord";
  const profileHref = landlordProfileHref(portal, identity.id);
  const reviewsHref = (nextPage: number, nextSort: ProfileReviewSort) =>
    landlordReviewsHref(portal, identity.id, { page: nextPage, sort: nextSort });

  const rangeStart = (page - 1) * PROFILE_REVIEWS_PAGE_SIZE + 1;
  const rangeEnd = rangeStart + reviews.length - 1;
  const rangeLabel = `Showing ${rangeStart}–${rangeEnd} of ${totalCount} ${totalCount === 1 ? "review" : "reviews"}`;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <BackBtn />
      </div>

      <PublicProfileLayout
        hasTopNavbar={portal === "public"}
        header={<PublicProfileHeader identity={identity} role="landlord" />}
        aside={
          <>
            <PublicProfileStats
              stats={[
                {
                  label: "Average rating",
                  value:
                    averageRating === null ? (
                      "—"
                    ) : (
                      <span className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1">
                        <StarRating rating={averageRating} size={16} className="flex gap-0.5" />
                        <span className="flex items-baseline gap-1">
                          {averageRating.toFixed(1)}
                          <span>({reviewCount})</span>
                        </span>
                      </span>
                    ),
                  hint: reviewCount === 0 ? "No reviews yet" : undefined,
                  icon: <IconStarFilled size={20} aria-hidden="true" />,
                },
                {
                  label: "Member since",
                  value: memberSinceYear(identity.joinedAt) ?? "—",
                },
              ]}
            />
            <Link href={profileHref} className={buttonVariants({ variant: "tertiary", fullWidth: true })}>
              View {firstName}&apos;s profile
            </Link>
          </>
        }
      >
        <PublicProfileSection
          title="Ratings & Reviews"
          description="Only tenants who rented one of these apartments can leave a review."
        >
          {reviewCount > 0 && averageRating !== null ? (
            <RatingBreakdown
              overallRate={averageRating}
              totalReviews={reviewCount}
              no5Star={ratingDistribution[5]}
              no4Star={ratingDistribution[4]}
              no3Star={ratingDistribution[3]}
              no2Star={ratingDistribution[2]}
              no1Star={ratingDistribution[1]}
            />
          ) : null}

          {totalCount > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">{rangeLabel}</p>
              {totalCount > 1 ? (
                <SettingsSelect
                  label="Sort reviews"
                  value={sort}
                  options={SORT_OPTIONS}
                  className="w-48"
                  onChange={(value) => router.push(reviewsHref(1, parseProfileReviewSort(value)))}
                />
              ) : null}
            </div>
          ) : null}

          {reviews.length === 0 ? (
            <PublicProfileEmptyState
              icon={IconMessage}
              title="No reviews yet"
              description="Reviews from tenants who rented this landlord's apartments will appear here."
            />
          ) : (
            <PublicProfileReviewList reviews={reviews} reviewCount={reviewCount} note={null} />
          )}

          {pageCount > 1 ? (
            <nav aria-label="Review pages" className="flex items-center justify-between gap-3">
              {page > 1 ? (
                <Link href={reviewsHref(page - 1, sort)} className={buttonVariants({ variant: "tertiary" })}>
                  Previous
                </Link>
              ) : (
                <span className={DISABLED_PAGE_LINK} aria-disabled="true">
                  Previous
                </span>
              )}

              <p className="text-sm text-muted-foreground">
                Page {page} of {pageCount}
              </p>

              {page < pageCount ? (
                <Link href={reviewsHref(page + 1, sort)} className={buttonVariants({ variant: "tertiary" })}>
                  Next
                </Link>
              ) : (
                <span className={DISABLED_PAGE_LINK} aria-disabled="true">
                  Next
                </span>
              )}
            </nav>
          ) : null}
        </PublicProfileSection>
      </PublicProfileLayout>
    </div>
  );
}
