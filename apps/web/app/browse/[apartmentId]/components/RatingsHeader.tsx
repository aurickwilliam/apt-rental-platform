"use client";

import { Button } from "@heroui/react";

interface RatingsHeaderProps {
  /** Omit when there is nothing more to open; the button is hidden. */
  onSeeAll?: () => void;
  /** Button text; the profile names the count, the apartment page stays generic. */
  seeAllLabel?: string;
  /** Heading level, so the same header fits pages whose sections use h2. */
  headingLevel?: "h2" | "h3";
}

// The "Ratings & Reviews" row shared by the apartment page and the landlord profile.
export default function RatingsHeader({
  onSeeAll,
  seeAllLabel = "See all reviews",
  headingLevel: Heading = "h3",
}: RatingsHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-5">
      <Heading className="font-nunito text-lg font-semibold">Ratings & Reviews</Heading>

      {onSeeAll ? (
        <Button size="sm" variant="ghost" onPress={onSeeAll} className="-mr-3 text-brand">
          {seeAllLabel}
        </Button>
      ) : null}
    </div>
  );
}
