"use client";

import { useState } from "react";

import Image from "next/image";

import { Card } from "@heroui/react";

import PhotoGalleryModal from "@/app/components/display/PhotoGalleryModal";
import StarRating from "@/app/components/display/StarRating";
import UserAvatar from "@/app/components/profile/UserAvatar";

const REVIEW_CHAR_LIMIT = 150;
const MAX_VISIBLE_THUMBNAILS = 4;

interface ReviewCardProps {
  reviewerName: string;
  reviewerAvatar?: string;
  reviewDate: string;
  reviewText: string;
  stayPeriod?: string;
  rating?: number;
  images?: string[];
  className?: string;
}

export default function ReviewCard({
  reviewerName,
  reviewerAvatar,
  reviewDate,
  reviewText,
  stayPeriod,
  rating,
  images,
  className,
}: ReviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);

  const isLongReview = reviewText.length > REVIEW_CHAR_LIMIT;
  const displayedReview =
    isLongReview && !isExpanded
      ? `${reviewText.slice(0, REVIEW_CHAR_LIMIT).trimEnd()}…`
      : reviewText;

  const visibleThumbnails = images?.slice(0, MAX_VISIBLE_THUMBNAILS) ?? [];
  const remainingCount = images ? images.length - MAX_VISIBLE_THUMBNAILS : 0;
  const galleryPhotos = (images ?? []).map((url) => ({ url }));

  const openGalleryAt = (index: number) => setGalleryIndex(index);
  const closeGallery = () => setGalleryIndex(null);

  return (
    <>
    <Card className={["gap-0 rounded-3xl border border-border bg-card shadow-none", className].filter(Boolean).join(" ")}>
      <Card.Header className="flex flex-row items-center gap-3">
        <UserAvatar
          src={reviewerAvatar}
          initials={reviewerName
            .split(" ")
            .map((part) => part[0]?.toUpperCase())
            .join("")}
          alt={reviewerName}
          size="md"
        />

        <div className="flex flex-1 flex-col">
          <h3 className="font-nunito text-base font-semibold text-card-foreground">
            {reviewerName}
          </h3>
          <p className="text-sm text-muted-foreground">
            {reviewDate}
          </p>
        </div>

        {rating !== undefined && (
          <div className="flex items-center gap-1">
            <StarRating rating={rating} size={14} />
            <span className="text-sm font-medium text-card-foreground">{rating.toFixed(1)}</span>
          </div>
        )}
      </Card.Header>

      <Card.Content>
        <p className="text-sm text-card-foreground">
          {displayedReview}
        </p>

        {isLongReview && (
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="mt-1 text-sm font-medium text-secondary"
          >
            {isExpanded ? "Show less" : "Read more"}
          </button>
        )}

        {visibleThumbnails.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {visibleThumbnails.map((src, index) => {
              const isLastVisible = index === MAX_VISIBLE_THUMBNAILS - 1;
              const showOverlay = isLastVisible && remainingCount > 0;

              return (
                <button
                  key={src + index}
                  type="button"
                  onClick={() =>
                    openGalleryAt(showOverlay ? MAX_VISIBLE_THUMBNAILS : index)
                  }
                  aria-label={`View review photo ${showOverlay ? MAX_VISIBLE_THUMBNAILS + 1 : index + 1}`}
                  className="relative size-16 cursor-pointer overflow-hidden rounded-xl focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <Image
                    src={src}
                    alt={`Review photo ${index + 1}`}
                    width={64}
                    height={64}
                    unoptimized
                    className="size-full object-cover"
                  />
                  {showOverlay && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <span className="text-sm font-medium text-white">
                        +{remainingCount}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </Card.Content>

      {stayPeriod && (
        <Card.Footer>
          <span className="text-sm text-muted-foreground">
            {stayPeriod}
          </span>
        </Card.Footer>
      )}
    </Card>

      {galleryPhotos.length > 0 && (
        <PhotoGalleryModal
          name={reviewerName}
          photos={galleryPhotos}
          isOpen={galleryIndex !== null}
          onOpenChange={(open) => {
            if (!open) closeGallery();
          }}
          activeIndex={galleryIndex ?? 0}
          onActiveIndexChange={setGalleryIndex}
        />
      )}
    </>
  );
}