import { Card, Separator } from "@heroui/react";
import { IconStar } from "@tabler/icons-react";
import { submittedFormatter } from "../../../verification/lib/verification-display";
import { DetailEmptyState, MetricItem } from "./UserDetailPrimitives";

export interface UserReview {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string | null;
  apartment_name: string;
}

interface UserReputationProps {
  reviews: UserReview[];
  averageRating: number | null;
  totalReviews: number;
  favoritesCount: number;
  showFavorites: boolean;
}

export default function UserReputation({
  reviews,
  averageRating,
  totalReviews,
  favoritesCount,
  showFavorites,
}: UserReputationProps) {
  const latest = reviews[0] ?? null;
  return (
    <Card className="rounded-3xl border border-border bg-card p-4 shadow-none sm:p-5">
      <Card.Content className="p-0">
      <h2 className="flex items-center gap-2 font-nunito text-lg font-bold text-primary">
        <IconStar size={20} className="shrink-0 text-primary" aria-hidden="true" />
        Reputation
      </h2>
      <div className="mt-3 grid grid-cols-3 gap-4">
        <MetricItem value={String(totalReviews)} label="Reviews" />
        <MetricItem
          value={showFavorites ? String(favoritesCount) : "—"}
          label="Favorites"
        />
        <MetricItem
          value={averageRating !== null ? averageRating.toFixed(1) : "—"}
          label="Rating"
        />
      </div>
      {latest ? (
        <>
          <Separator className="my-3" />
          <div className="text-sm">
          <p className="font-medium wrap-break-word">
            {latest.rating}/5 · {latest.apartment_name}
          </p>
          {latest.comment ? (
            <p className="mt-1 line-clamp-2 text-muted-foreground wrap-break-word">
              {latest.comment}
            </p>
          ) : null}
          {latest.created_at ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {submittedFormatter.format(new Date(latest.created_at))}
            </p>
          ) : null}
          </div>
        </>
      ) : (
        <DetailEmptyState>No review activity yet</DetailEmptyState>
      )}
      </Card.Content>
    </Card>
  );
}
