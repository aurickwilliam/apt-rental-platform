"use client";

import { useRouter } from "next/navigation";

import { Button, Card } from "@heroui/react";
import { IconMessage } from "@tabler/icons-react";

import ReviewCard from "./ReviewCard";
import ErrorBanner from "@/app/components/display/ErrorBanner";
import { useTranslation } from "@/app/components/i18n/LocaleProvider";
import { useApartmentReviews } from "@/hooks/use-apartment-reviews";
import { formatDate } from "@repo/i18n";

interface ApartmentReviewsPreviewProps {
  apartmentId: string;
  basePath?: string;
}

function EmptyReviewsState() {
  const { t } = useTranslation();

  return (
    <Card className="flex min-h-[150px] items-center justify-center p-8 shadow-none border border-default-200">
      <div className="flex max-w-sm flex-col items-center text-center">
        <div className="mb-5 flex size-16 items-center justify-center rounded-full bg-secondary">
          <IconMessage className="size-8 text-brand" />
        </div>

        <h3 className="text-lg font-semibold text-foreground">{t("reviews.previewEmptyTitle")}</h3>

        <p className="mt-2 text-sm text-default-500">
          {t("reviews.previewEmptyBody")}
        </p>
      </div>
    </Card>
  );
}

export default function ApartmentReviewsPreview({ apartmentId, basePath = "/browse" }: ApartmentReviewsPreviewProps) {
  const router = useRouter();
  const { language, t } = useTranslation();
  const { reviews, loading, error, refresh } = useApartmentReviews(apartmentId, false);

  if (loading) return null;
  if (error) {
    return (
      <ErrorBanner message={error}>
        <Button size="sm" variant="outline" onPress={refresh}>{t("reviews.retry")}</Button>
      </ErrorBanner>
    );
  }
  if (reviews.length === 0) {
    return <EmptyReviewsState />;
  }

  const preview = reviews.slice(0, 3);
  const remaining = reviews.length - preview.length;

  return (
    <div>
      <div className="flex flex-col gap-3">
        {preview.map((review) => (
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

      {remaining > 0 && (
        <Card className="mt-3 flex flex-row items-center justify-between p-4 shadow-none border border-default-200">
          <p className="text-sm text-default-600">
            {remaining > 1
              ? t("reviews.morePlural", { count: remaining })
              : t("reviews.more", { count: remaining })}
          </p>

          <Button size="sm" variant="ghost" onPress={() => router.push(`${basePath}/${apartmentId}/ratings`)}>
            {t("reviews.seeAll")}
          </Button>
        </Card>
      )}
    </div>
  );
}
