"use client";

import { Button, toast } from "@heroui/react";
import { IconFlag } from "@tabler/icons-react";

interface ReportRatingButtonProps {
  /** The `tenant_reviews.id` being reported. */
  reviewId: string;
  /** Wire the report flow here; until then the button only says reporting is not available yet. */
  onReport?: (reviewId: string) => void;
}

/** Report entry point for a landlord's rating of a tenant. The report flow itself is not built yet. */
export default function ReportRatingButton({ reviewId, onReport }: ReportRatingButtonProps) {
  const handlePress = () => {
    if (onReport) {
      onReport(reviewId);
      return;
    }
    toast.info("Reporting ratings is coming soon.");
  };

  return (
    <Button
      size="sm"
      variant="ghost"
      onPress={handlePress}
      aria-label="Report this rating"
      className="mt-2 cursor-pointer gap-1.5 rounded-full font-nunito text-muted-foreground"
    >
      <IconFlag size={14} aria-hidden="true" />
      Report
    </Button>
  );
}
