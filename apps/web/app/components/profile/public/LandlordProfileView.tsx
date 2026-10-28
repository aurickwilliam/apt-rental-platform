"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Button } from "@heroui/react";
import {
  IconBuildingSkyscraper,
  IconCalendarMonth,
  IconMessage,
  IconShieldCheck,
  IconStar,
  IconStarFilled,
  IconUsers,
} from "@tabler/icons-react";

import BackBtn from "@/app/browse/[apartmentId]/components/BackBtn";
import RatingBreakdown from "@/app/browse/[apartmentId]/components/RatingBreakdown";
import RatingsHeader from "@/app/browse/[apartmentId]/components/RatingsHeader";
import MessageLandlordPanel from "@/app/components/chat/MessageLandlordPanel";
import StarRating from "@/app/components/display/StarRating";
import ApartmentCard from "@/app/components/ui/ApartmentCard";
import { useUser } from "@/hooks/use-user";
import { apartmentHref, landlordReviewsHref, memberSinceYear } from "@/lib/public-profile";

import PublicProfileContactCard from "./PublicProfileContactCard";
import PublicProfileContactLockedCard from "./PublicProfileContactLockedCard";
import PublicProfileEmptyState from "./PublicProfileEmptyState";
import PublicProfileHeader from "./PublicProfileHeader";
import PublicProfileLayout from "./PublicProfileLayout";
import PublicProfileReviewList from "./PublicProfileReviewList";
import PublicProfileSection from "./PublicProfileSection";
import PublicProfileStats from "./PublicProfileStats";
import PublicProfileDocumentsCard from "./PublicProfileDocumentsCard";
import type { PublicProfileTrustItem } from "./PublicProfileTrustStrip";
import type { LandlordProfileData } from "./types";

interface LandlordProfileViewProps {
  data: LandlordProfileData;
  /** Which shell the page renders in; decides where listing cards link. */
  portal: "public" | "tenant";
}

// The listings share the wide column with the side card from xl, so the grid is denser than Browse's.
const LISTING_GRID_CLASS = "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-4";

// A landlord can publish many apartments; the profile shows the newest few until asked.
const INITIAL_LISTING_LIMIT = 8;

const plural = (count: number, singular: string, pluralForm = `${singular}s`) =>
  count === 1 ? singular : pluralForm;

export default function LandlordProfileView({ data, portal }: LandlordProfileViewProps) {
  const router = useRouter();
  const { profile } = useUser();
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [showAllListings, setShowAllListings] = useState(false);

  const { identity, contact, listings, reviews, reviewCount, ratingDistribution } = data;
  const firstName = identity.displayName.split(" ")[0] || "Landlord";
  const viewerId = profile?.id ?? null;
  // The profile shows the newest few reviews; the full, sortable list has its own page.
  const canExpandReviews = reviews.length < reviewCount;
  const showAllReviews = () => router.push(landlordReviewsHref(portal, identity.id));
  const isOwner = Boolean(viewerId && viewerId === identity.id);
  const canMessage = Boolean(viewerId) && !isOwner;

  const visibleListings = showAllListings ? listings : listings.slice(0, INITIAL_LISTING_LIMIT);
  const hiddenListingCount = listings.length - visibleListings.length;
  // The loader caps how many listings it reads; say so instead of claiming the
  // loaded page is everything the landlord has.
  const hasCompleteListingSet = data.listedTotal <= listings.length;

  // Only facts stored in the database: listing verification, real review rows
  // and current occupancy. Identity verification already renders as the header
  // badge (with its tooltip), so it is not repeated here. No invented scores.
  const trustItems: PublicProfileTrustItem[] = [];

  if (data.isOwnershipVerified) {
    trustItems.push({
      key: "ownership",
      label: "Verified landlord",
      tone: "success",
      icon: <IconShieldCheck size={14} aria-hidden="true" />,
    });
  }

  if (data.listedTotal > 0) {
    const allVerified = data.verifiedListings === data.listedTotal;
    trustItems.push({
      key: "listings",
      label: allVerified
        ? `${data.listedTotal} verified ${plural(data.listedTotal, "listing")}`
        : `${data.verifiedListings} of ${data.listedTotal} listings verified`,
      tone: allVerified ? "success" : "neutral",
      icon: <IconShieldCheck size={14} aria-hidden="true" />,
    });
  }

  if (reviewCount > 0) {
    trustItems.push({
      key: "reviews",
      label: `${reviewCount} tenant ${plural(reviewCount, "review")}`,
      tone: "neutral",
      icon: <IconStar size={14} aria-hidden="true" />,
      href: "#reviews",
    });
  }

  if (data.units.occupied > 0) {
    trustItems.push({
      key: "occupied",
      label: `${data.units.occupied} ${plural(data.units.occupied, "unit")} occupied`,
      tone: "neutral",
      icon: <IconUsers size={14} aria-hidden="true" />,
    });
  }

  const averageRating = data.averageRating;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <BackBtn />
      </div>

      <PublicProfileLayout
        hasTopNavbar={portal === "public"}
        header={<PublicProfileHeader identity={identity} role="landlord" trustItems={trustItems} />}
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
                          <a
                            href="#reviews"
                            aria-label={`${reviewCount} tenant ${plural(reviewCount, "review")}`}
                            className="underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                          >
                            ({reviewCount})
                          </a>
                        </span>
                      </span>
                    ),
                  hint: reviewCount === 0 ? "No reviews yet" : undefined,
                  icon: <IconStarFilled size={20} aria-hidden="true" />,
                },
                {
                  label: "Properties",
                  value: `${data.units.total} ${plural(data.units.total, "Property", "Properties")}`,
                  icon: <IconBuildingSkyscraper size={20} aria-hidden="true" />,
                },
                {
                  label: "Member since",
                  value: memberSinceYear(identity.joinedAt) ?? "—",
                  icon: <IconCalendarMonth size={20} aria-hidden="true" />,
                },
              ]}
            />
            <PublicProfileDocumentsCard
              title="Verified on APT Passport"
              documents={data.ownershipDocuments}
              emptyText="This landlord hasn't added an ownership document yet."
            />
            {contact ? (
              <PublicProfileContactCard
                contact={contact}
                areas={data.cities}
                displayName={firstName}
                onMessagePress={canMessage ? () => setIsMessageOpen(true) : undefined}
              />
            ) : (
              <PublicProfileContactLockedCard displayName={firstName} />
            )}
          </>
        }
      >
        <PublicProfileSection title={`${firstName}'s listings`}>
          {listings.length === 0 ? (
            <PublicProfileEmptyState
              icon={IconBuildingSkyscraper}
              title="No listings yet"
              description="This landlord hasn't published any apartments yet."
            />
          ) : (
            <>
              <div className={LISTING_GRID_CLASS}>
                {visibleListings.map((listing) => (
                  <ApartmentCard
                    key={listing.id}
                    name={listing.name}
                    location={listing.location}
                    price={listing.price}
                    rating={listing.rating}
                    isVerified={listing.isVerified}
                    thumbnailUrl={listing.thumbnailUrl}
                    onPress={() => router.push(apartmentHref(portal, listing.id))}
                  />
                ))}
              </div>
              {hiddenListingCount > 0 || showAllListings ? (
                <Button
                  variant="tertiary"
                  className="self-center rounded-full"
                  onPress={() => setShowAllListings((current) => !current)}
                >
                  {showAllListings
                    ? "Show fewer listings"
                    : hasCompleteListingSet
                      ? `Show all ${listings.length} listings`
                      : `Show ${listings.length} listings`}
                </Button>
              ) : null}
              {hasCompleteListingSet ? null : (
                <p className="text-center text-sm text-muted-foreground">
                  Showing the {listings.length} newest of {data.listedTotal} listings.
                </p>
              )}
            </>
          )}
        </PublicProfileSection>

        <section id="reviews" className="flex scroll-mt-24 flex-col gap-3">
          <div>
            <RatingsHeader
              headingLevel="h2"
              onSeeAll={canExpandReviews ? showAllReviews : undefined}
              seeAllLabel={`See all ${reviewCount} reviews`}
            />
            <p className="-mt-3 text-sm text-muted-foreground">
              Only tenants who rented one of these apartments can leave a review.
            </p>
          </div>

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

          {reviews.length === 0 ? (
            <PublicProfileEmptyState
              icon={IconMessage}
              title="No reviews yet"
              description="Reviews from tenants who rented this landlord's apartments will appear here."
            />
          ) : (
            <PublicProfileReviewList reviews={reviews} reviewCount={reviewCount} />
          )}
        </section>
      </PublicProfileLayout>

      {canMessage ? (
        <MessageLandlordPanel
          isOpen={isMessageOpen}
          onOpenChange={setIsMessageOpen}
          currentUserId={viewerId}
          landlordId={identity.id}
          landlordName={identity.displayName}
          landlordAvatarUrl={identity.avatarUrl}
          apartmentId={null}
          apartmentName={null}
        />
      ) : null}
    </div>
  );
}
