"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Button, Skeleton } from "@heroui/react";
import { IconArrowRight, IconStar } from "@tabler/icons-react";
import { APPLICANT_RATINGS_PREVIEW_LIMIT, describeTenantRatingSummary } from "@repo/utils";

import EmptyState from "@/app/components/display/EmptyState";
import StarRating from "@/app/components/display/StarRating";
import PublicProfileReviewList from "@/app/components/profile/public/PublicProfileReviewList";
import { useApplicantRatings } from "@/hooks/use-applicant-ratings";
import { tenantProfileHref, toTenantRatingCard } from "@/lib/public-profile";
import ApplicationDetailSection from "./ApplicationDetailSection";

interface ApplicantRatingsSectionProps {
  tenantId: string;
  tenantName: string;
}

/**
 * Landlord ratings of the applicant, so the landlord can weigh them before approving or
 * rejecting. It loads on its own: a failed read shows a small retry here and leaves the
 * rest of the application, including the decision buttons, untouched.
 */
export default function ApplicantRatingsSection({ tenantId, tenantName }: ApplicantRatingsSectionProps) {
  const { ratings, loading, error, refresh } = useApplicantRatings(tenantId);
  const cards = useMemo(() => ratings.records.slice(0, APPLICANT_RATINGS_PREVIEW_LIMIT).map(toTenantRatingCard), [ratings.records]);

  return (
    <ApplicationDetailSection
      title="Landlord Ratings"
      subtitle="What other landlords said about this tenant after their lease ended."
      icon={IconStar}
    >
      {loading ? (
        <div className="flex flex-col gap-3" role="status" aria-label="Loading ratings">
          <Skeleton className="h-6 w-56 bg-skeleton!" />
          <Skeleton className="h-24 w-full rounded-xl bg-skeleton!" />
        </div>
      ) : error ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/20 bg-danger/5 p-4">
          <p className="text-sm text-danger">Could not load this tenant&apos;s ratings. You can still review and decide on the application.</p>
          <Button size="sm" variant="secondary" onPress={() => void refresh()}>Try Again</Button>
        </div>
      ) : ratings.count === 0 ? (
        <EmptyState
          className="py-8"
          icon={IconStar}
          title="No ratings yet"
          description={`No landlord has rated ${tenantName} yet. Landlords can rate a tenant once their lease has ended.`}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-nunito text-3xl font-bold text-card-foreground">{ratings.average.toFixed(1)}</span>
            <div className="flex flex-col gap-1">
              <StarRating rating={ratings.average} size={18} />
              <p className="text-sm text-muted-foreground">{describeTenantRatingSummary(ratings)}</p>
            </div>
          </div>
          <PublicProfileReviewList reviews={cards} reviewCount={ratings.count} />
        </div>
      )}
      <Link
        href={tenantProfileHref(tenantId)}
        className="inline-flex w-fit cursor-pointer items-center gap-1 text-sm font-nunito font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        View full profile<IconArrowRight size={16} aria-hidden="true" />
      </Link>
    </ApplicationDetailSection>
  );
}
