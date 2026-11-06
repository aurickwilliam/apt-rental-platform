"use client";

import { useRef, useState, type PointerEvent } from "react";

import Image from "next/image";

import { Card, Button, Spinner } from "@heroui/react";

import { IconHeart, IconHeartFilled, IconShieldCheckFilled, IconStarFilled } from "@tabler/icons-react";

import { formatPesoDisplay } from "@repo/utils";
import StatusChip from "@/app/components/display/StatusChip";
import { canOptimizePublicApartmentImage } from "@/lib/public-apartment-image";
import PreferenceMatchChips from "./PreferenceMatchChips";

// Shown when a listing has no photo or its file no longer resolves, so a card
// never renders an empty/broken box.
const FALLBACK_THUMBNAIL = "/images/house-check.png";

interface ApartmentCardProps {
  name: string;
  location: string;
  price: number;
  rating: number;
  isVerified?: boolean;
  thumbnailUrl: string;
  onPress?: () => void;
  isFavorite?: boolean;
  isFavoriteLoading?: boolean;
  onFavoritePress?: () => void;
  matchLabels?: string[];
  onPreviewHover?: (element: HTMLElement) => void;
  onPreviewLeave?: () => void;
  onFavoriteInteraction?: () => void;
  /** Above-the-fold cards only: disables lazy loading for faster LCP. */
  priority?: boolean;
  /** Rendered-width hint so the browser picks a fitting file. */
  sizes?: string;
}

export default function ApartmentCard({
  name,
  location,
  price,
  rating,
  isVerified = false,
  thumbnailUrl,
  onPress,
  isFavorite = false,
  isFavoriteLoading = false,
  onFavoritePress,
  matchLabels = [],
  onPreviewHover,
  onPreviewLeave,
  onFavoriteInteraction,
  priority = false,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
}: ApartmentCardProps) {
  const showFavoriteButton = Boolean(onFavoritePress);
  // Track the URL that failed rather than a boolean, so a new thumbnail for the
  // same card position retries the real image instead of keeping the fallback.
  const [failedThumbnailUrl, setFailedThumbnailUrl] = useState<string | null>(null);
  const thumbnailSrc =
    !thumbnailUrl || failedThumbnailUrl === thumbnailUrl ? FALLBACK_THUMBNAIL : thumbnailUrl;
  const canOptimizeThumbnail = canOptimizePublicApartmentImage(thumbnailSrc);
  const hoveringBody = useRef(false);

  const hoverBody = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") return;
    if ((event.target as HTMLElement).closest('[data-preview-control], button:not([data-preview-navigation]), a, input, select, textarea')) {
      hoveringBody.current = false;
      onFavoriteInteraction?.();
      return;
    }
    if (hoveringBody.current) return;
    hoveringBody.current = true;
    onPreviewHover?.(event.currentTarget);
  };

  return (
    <div
      data-preview-card
      className="w-full min-w-0 rounded-xl"
      onPointerOver={hoverBody}
      onPointerMove={hoverBody}
      onPointerLeave={() => {
        hoveringBody.current = false;
        onPreviewLeave?.();
      }}
    >
      <Card className="bg-surface border border-transparent hover:border-primary transition-all duration-200 rounded-xl overflow-hidden w-full h-full relative p-0">
        <div className="min-w-0">
          <Image
            src={thumbnailSrc}
            alt=""
            width={600}
            height={600}
            unoptimized={!canOptimizeThumbnail}
            priority={priority}
            sizes={sizes}
            className="object-cover rounded-xl w-full aspect-square h-auto"
            onError={() => {
              if (thumbnailUrl) setFailedThumbnailUrl(thumbnailUrl);
            }}
          />

          <div data-slot="apartment-card-details" className="p-2">
            <h3 className="text-[15px] font-semibold truncate">{name}</h3>

            <div className="flex items-center gap-1">
              <p data-slot="apartment-card-location" className="bg-surface-variant text-xs">
                {location}
              </p>
            </div>
            <PreferenceMatchChips labels={matchLabels} />
          </div>
        </div>

        <Card.Footer className="p-2 flex justify-between items-center">
          <p data-slot="apartment-card-price" className="text-[15px] font-medium text-primary">
            {formatPesoDisplay(price)}
          </p>

          <div className="flex items-center gap-1">
            <IconStarFilled size={18} className="text-yellow-400" />
            <p className="text-sm">
              {rating === 0 ? "-" : rating}
            </p>
          </div>
        </Card.Footer>

        {onPress ? (
          <Button variant="ghost" data-preview-navigation className="apartment-card-navigation button--bare"
            aria-label={`View ${name}`} onPress={onPress} />
        ) : null}

        {isVerified ? (
          <StatusChip tone="success" size="sm" className="pointer-events-none absolute top-2 left-2">
            <span className="flex items-center gap-1">
              <IconShieldCheckFilled size={14} aria-hidden="true" />
              Verified
            </span>
          </StatusChip>
        ) : null}

        {showFavoriteButton ? (
          <span
            data-preview-control
            data-apartment-favorite
            className="absolute top-2 right-2 z-10"
            onClick={(e) => e.stopPropagation()}
            onPointerEnter={onFavoriteInteraction}
            onPointerDown={onFavoriteInteraction}
            onFocus={onFavoriteInteraction}
          >
          <Button
            variant="ghost"
            className="bg-white/75"
            isIconOnly
            aria-label={isFavorite ? "Remove from favorites" : "Save to favorites"}
            isPending={isFavoriteLoading}
            onPress={() => {
              onFavoritePress?.();
            }}
          >
            {({ isPending }) => (
              <>
                {isPending ? (
                  <Spinner
                    color="current"
                    size="sm"
                  />
                ) : isFavorite ? (
                  <IconHeartFilled size={18} className="text-red-500" />
                ) : (
                  <IconHeart size={18} className="text-grey-500" />
                )}
              </>
            )}
          </Button>
          </span>
        ) : null}
      </Card>
    </div>
  );
}
