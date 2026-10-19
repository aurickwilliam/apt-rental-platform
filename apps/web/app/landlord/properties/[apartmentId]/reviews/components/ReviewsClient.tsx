"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Dropdown, Label } from "@heroui/react";
import { IconArrowLeft as ArrowLeft, IconChevronDown as ChevronDown, IconMessage as MessageSquareText, IconStar } from "@tabler/icons-react";
import ReviewCard from "@/app/browse/[apartmentId]/components/ReviewCard";
import RatingBreakdown from "@/app/browse/[apartmentId]/components/RatingBreakdown";
import type { LandlordUnitReview } from "@/service/landlordUnitDetailService";

type ReviewSortOption = "Most Recent" | "Highest Rating" | "Lowest Rating";

const SORT_OPTIONS: ReviewSortOption[] = ["Most Recent", "Highest Rating", "Lowest Rating"];

type Props = {
  apartmentId: string;
  apartmentName: string;
  reviews: LandlordUnitReview[];
};

function formatReviewDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default function ReviewsClient({ apartmentId, apartmentName, reviews }: Props) {
  const router = useRouter();
  const [sortBy, setSortBy] = useState<ReviewSortOption>("Most Recent");

  const stats = useMemo(() => {
    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const r of reviews) {
      const bucket = Math.min(5, Math.max(1, Math.round(r.rating)));
      counts[bucket] += 1;
    }
    const total = reviews.length;
    const average =
      total > 0 ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / total) * 10) / 10 : 0;
    return { total, average, counts };
  }, [reviews]);

  const sorted = useMemo(() => {
    const list = [...reviews];
    switch (sortBy) {
      case "Highest Rating":
        return list.sort((a, b) => b.rating - a.rating || +new Date(b.date) - +new Date(a.date));
      case "Lowest Rating":
        return list.sort((a, b) => a.rating - b.rating || +new Date(b.date) - +new Date(a.date));
      default:
        return list.sort((a, b) => +new Date(b.date) - +new Date(a.date));
    }
  }, [reviews, sortBy]);

  return (
    <div className="w-full min-w-0 p-4 flex flex-col gap-4 bg-card min-h-0">
      <div>
        <Button
          variant="ghost"
          size="sm"
          onPress={() => router.push(`/landlord/properties/${apartmentId}`)}
          onHoverStart={() => router.prefetch(`/landlord/properties/${apartmentId}`)}
          onFocus={() => router.prefetch(`/landlord/properties/${apartmentId}`)}
          className="gap-1.5 font-nunito w-fit"
        >
          <ArrowLeft size={16} aria-hidden="true" /> Back to Property
        </Button>
        <h1 className="mt-2 text-2xl font-bold font-nunito text-card-foreground">Property Reviews</h1>
        <p className="mt-1 text-sm text-muted-foreground">Tenant feedback for {apartmentName}.</p>
      </div>

      <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <Card className="landlord-reviews-panel border border-border" aria-label="Rating summary">
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <IconStar size={24} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-base font-nunito font-bold text-card-foreground">Rating Summary</h2>
              <p className="text-xs text-muted-foreground">An overview of tenant ratings.</p>
            </div>
          </div>
          {stats.total > 0 ? (
            <RatingBreakdown
              layout="stacked"
              overallRate={stats.average}
              totalReviews={stats.total}
              no5Star={stats.counts[5]}
              no4Star={stats.counts[4]}
              no3Star={stats.counts[3]}
              no2Star={stats.counts[2]}
              no1Star={stats.counts[1]}
            />
          ) : (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <IconStar size={40} className="text-muted-foreground" aria-hidden="true" />
              <p className="text-base font-nunito font-semibold text-card-foreground">No ratings yet</p>
              <p className="max-w-64 text-sm leading-6 text-muted-foreground">Your rating summary will appear after a tenant submits a review.</p>
            </div>
          )}
        </Card>

        <section className="flex min-w-0 flex-col gap-4" aria-labelledby="tenant-reviews-heading">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <MessageSquareText size={24} aria-hidden="true" />
              </span>
              <div>
                <h2 id="tenant-reviews-heading" className="text-base font-nunito font-bold text-card-foreground">Tenant Reviews</h2>
                <p className="text-xs text-muted-foreground">{stats.total} {stats.total === 1 ? "review" : "reviews"}</p>
              </div>
            </div>
            {stats.total > 0 && (
              <Dropdown>
                <Button variant="outline" size="sm" aria-label={`Sort reviews: ${sortBy}`}>
                  {sortBy}
                  <ChevronDown size={16} aria-hidden="true" />
                </Button>
                <Dropdown.Popover>
                  <Dropdown.Menu
                    aria-label="Sort reviews"
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

          {stats.total === 0 ? (
            <Card className="landlord-reviews-panel border border-border">
              <div className="flex min-h-80 flex-col items-center justify-center gap-3 px-4 py-8 text-center">
                <span className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <MessageSquareText size={30} aria-hidden="true" />
                </span>
                <h3 className="text-lg font-nunito font-bold text-card-foreground">No reviews yet</h3>
                <p className="max-w-md text-sm leading-6 text-muted-foreground">Reviews from tenants will show up here once they&apos;re submitted.</p>
              </div>
            </Card>
          ) : (
            <div className="grid min-w-0 grid-cols-1 items-start gap-4 2xl:grid-cols-2">
              {sorted.map((review) => (
                <div key={review.id} className="min-w-0">
                  <ReviewCard
                    className="landlord-review-card"
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
        </section>
      </div>
    </div>
  );
}
