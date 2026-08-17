"use client";

import { useState } from "react";

import Image from "next/image";

import { Card, Avatar } from "@heroui/react";

import StarRating from "@/app/components/display/StarRating";

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
}

export default function ReviewCard({
  reviewerName,
  reviewerAvatar,
  reviewDate,
  reviewText,
  stayPeriod,
  rating,
  images,
}: ReviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isLongReview = reviewText.length > REVIEW_CHAR_LIMIT;
  const displayedReview =
    isLongReview && !isExpanded
      ? `${reviewText.slice(0, REVIEW_CHAR_LIMIT).trimEnd()}…`
      : reviewText;

  const visibleThumbnails = images?.slice(0, MAX_VISIBLE_THUMBNAILS) ?? [];
  const remainingCount = images ? images.length - MAX_VISIBLE_THUMBNAILS : 0;

  return (
    <Card className="gap-0">
      <Card.Header className="flex gap-3">
        <Avatar size="md">
          {reviewerAvatar && <Avatar.Image src={reviewerAvatar} alt={reviewerName} />}
          <Avatar.Fallback>
            {reviewerName
              .split(" ")
              .map((part) => part[0]?.toUpperCase())
              .join("")}
          </Avatar.Fallback>
        </Avatar>

        <div className="flex flex-1 flex-col">
          <h3 className="text-base font-medium">
            {reviewerName}
          </h3>
          <p className="text-sm text-grey-500">
            {reviewDate}
          </p>
        </div>

        {rating !== undefined && (
          <div className="flex items-center gap-1">
            <StarRating rating={rating} size={14} />
            <span className="text-sm font-medium">{rating.toFixed(1)}</span>
          </div>
        )}
      </Card.Header>

      <Card.Content>
        <p className="text-sm">
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
          <div className="mt-3 flex gap-2">
            {visibleThumbnails.map((src, index) => {
              const isLastVisible = index === MAX_VISIBLE_THUMBNAILS - 1;
              const showOverlay = isLastVisible && remainingCount > 0;

              return (
                <div
                  key={src + index}
                  className="relative size-16 overflow-hidden rounded-xl"
                >
                  <Image
                    src={src}
                    alt={`Review photo ${index + 1}`}
                    width={64}
                    height={64}
                    className="size-full object-cover"
                  />
                  {showOverlay && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <span className="text-sm font-medium text-white">
                        +{remainingCount}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card.Content>

      {stayPeriod && (
        <Card.Footer>
          <span className="text-sm text-gray-500">
            {stayPeriod}
          </span>
        </Card.Footer>
      )}
    </Card>
  );
}