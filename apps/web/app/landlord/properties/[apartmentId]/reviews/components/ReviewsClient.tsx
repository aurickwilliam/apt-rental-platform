"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Dropdown, Label } from "@heroui/react";
import { ArrowLeft, ChevronDown, MessageSquareText } from "lucide-react";
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
    <div className="mx-auto max-w-5xl p-4">
      <Button variant="outline" size="sm" onPress={() => router.push(`/landlord/properties/${apartmentId}`)} className="w-fit">
        <ArrowLeft size={16} /> Back to Property
      </Button>

      <h1 className="mt-4 text-2xl font-medium md:text-3xl">Reviews · {apartmentName}</h1>

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

      {stats.total === 0 ? (
        <Card className="mt-5 flex flex-col items-center gap-3 p-10 text-center shadow-none border border-default-200">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <MessageSquareText size={26} className="text-primary" />
          </div>
          <p className="text-base font-medium">No reviews yet</p>
          <p className="text-sm text-muted-foreground">
            Reviews from tenants will show up here once they&apos;re submitted.
          </p>
        </Card>
      ) : (
        <div className="mt-5 columns-1 gap-3 md:columns-2">
          {sorted.map((review) => (
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
    </div>
  );
}
