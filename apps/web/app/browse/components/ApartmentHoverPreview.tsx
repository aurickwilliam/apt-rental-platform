"use client";

import Image from "next/image";
import { useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";

import { Button, Card, Spinner } from "@heroui/react";
import {
  IconBath,
  IconBed,
  IconHeart,
  IconHeartFilled,
  IconRuler,
  IconShieldCheckFilled,
  IconStarFilled,
  IconX,
} from "@tabler/icons-react";

import { formatPesoDisplay } from "@repo/utils";
import type { BrowseApartment } from "../lib/fetch-browse-results";
import { canOptimizePublicApartmentImage } from "@/lib/public-apartment-image";
import { browsePreviewPosition, type PreviewAnchor } from "@/lib/browse-preview-position";

interface ApartmentHoverPreviewProps {
  apartment: BrowseApartment;
  anchor: PreviewAnchor;
  onDismiss: () => void;
  isFavorite: boolean;
  isFavoriteLoading: boolean;
  onFavoritePress: () => void;
  onViewDetails: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export default function ApartmentHoverPreview({
  apartment,
  anchor,
  onDismiss,
  isFavorite,
  isFavoriteLoading,
  onFavoritePress,
  onViewDetails,
  onMouseEnter,
  onMouseLeave,
}: ApartmentHoverPreviewProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const position = () => {
      // Read actual rendered height, including wrapped text.
      const next = browsePreviewPosition(
        anchor,
        { width: window.innerWidth, height: window.innerHeight },
        root.offsetHeight,
      );
      Object.assign(root.style, { left: `${next.left}px`, top: `${next.top}px`, width: `${next.width}px`, maxHeight: `${next.maxHeight}px` });
    };
    position();
    const observer = new ResizeObserver(position);
    observer.observe(root);
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.contains(event.target)) onDismiss();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onDismiss();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      observer.disconnect();
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [anchor, onDismiss]);
  const style = browsePreviewPosition(anchor, { width: window.innerWidth, height: window.innerHeight });
  // CSS-only enter animation (no motion library): fade + slight zoom on
  // mount, instant unmount. Respects reduced-motion preferences.
  return createPortal(
    <div
      ref={rootRef}
      data-browse-preview
      role="dialog"
      aria-label={`Quick preview of ${apartment.name}`}
      className="fixed z-50 overflow-y-auto overscroll-contain rounded-xl animate-in fade-in-0 zoom-in-95 duration-180 motion-reduce:animate-none"
      style={style}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseMove={(event) => {
        // A portaled preview can cover its source or a neighboring heart.
        // Hit-test the stacked elements so moving onto that real hit area
        // dismisses the overlay and hands the independent action back to it.
        if (document.elementsFromPoint(event.clientX, event.clientY).some(
          (element) => element.closest("[data-apartment-favorite]"),
        )) onDismiss();
      }}
      onFocus={onMouseEnter}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) onDismiss();
      }}
    >
      <Card className="overflow-hidden rounded-xl border border-divider bg-surface p-0 shadow-xl">
        <div className="relative">
          <Button variant="ghost" isIconOnly size="sm"
            aria-label="Close quick preview"
            className="absolute right-2 top-2 z-10 bg-white/90 text-foreground dark:bg-surface"
            onPress={onDismiss}>
            <IconX size={18} aria-hidden="true" />
          </Button>
          <Image
            src={apartment.image}
            alt={apartment.name}
            width={640}
            height={360}
            sizes="320px"
            unoptimized={!canOptimizePublicApartmentImage(apartment.image)}
            className="h-40 w-full object-cover"
          />
          {apartment.isVerified ? (
            <span className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-500">
              <IconShieldCheckFilled size={14} className="text-green-500" />
              Verified
            </span>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5 p-3">
          <h4 className="truncate text-base font-semibold">{apartment.name}</h4>
          <p className="truncate text-xs text-default-500">{apartment.location}</p>

          <div className="flex items-center justify-between">
            <p className="text-[15px] font-medium text-primary">
              {formatPesoDisplay(apartment.price)}
            </p>
            <p className="flex items-center gap-1 text-sm">
              <IconStarFilled size={16} className="text-yellow-400" />
              {apartment.rating === 0 ? "-" : apartment.rating}
            </p>
          </div>

          {apartment.bedrooms !== undefined ||
          apartment.bathrooms !== undefined ||
          apartment.areaSqm !== undefined ? (
            <div className="flex items-center gap-3 text-xs text-default-500">
              {apartment.bedrooms !== undefined && (
                <span className="flex items-center gap-1">
                  <IconBed size={14} />
                  {apartment.bedrooms} BR
                </span>
              )}
              {apartment.bathrooms !== undefined && (
                <span className="flex items-center gap-1">
                  <IconBath size={14} />
                  {apartment.bathrooms} BA
                </span>
              )}
              {apartment.areaSqm !== undefined && (
                <span className="flex items-center gap-1">
                  <IconRuler size={14} />
                  {apartment.areaSqm} sqm
                </span>
              )}
            </div>
          ) : null}

          <div className="mt-1 flex items-center gap-2">
            <Button
              size="sm"
              className="flex-1"
              onPress={onViewDetails}
              aria-label={`View details of ${apartment.name}`}
            >
              View Details
            </Button>
            <Button
              size="sm"
              variant="ghost"
              isIconOnly
              aria-label={isFavorite ? "Remove from favorites" : "Save to favorites"}
              isPending={isFavoriteLoading}
              onPress={onFavoritePress}
            >
              {({ isPending }) =>
                isPending ? (
                  <Spinner color="current" size="sm" />
                ) : isFavorite ? (
                  <IconHeartFilled size={18} className="text-red-500" />
                ) : (
                  <IconHeart size={18} className="text-grey-500" />
                )
              }
            </Button>
          </div>
        </div>
      </Card>
    </div>, document.body,
  );
}
