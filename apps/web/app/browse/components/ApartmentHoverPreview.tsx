"use client";

import type { CSSProperties } from "react";
import Image from "next/image";

import { Button, Card, Spinner } from "@heroui/react";
import {
  IconBath,
  IconBed,
  IconHeart,
  IconHeartFilled,
  IconMaximize,
  IconShieldCheckFilled,
  IconStarFilled,
  type Icon,
} from "@tabler/icons-react";

import { formatPesoDisplay } from "@repo/utils";
import StatusChip from "@/app/components/display/StatusChip";
import type { BrowseApartment } from "../lib/fetch-browse-results";
import { canOptimizePublicApartmentImage } from "@/lib/public-apartment-image";
import type { PreviewPlacement } from "./use-hover-preview";
import PreferenceMatchChips from "@/app/components/ui/PreferenceMatchChips";

interface ApartmentHoverPreviewProps {
  apartment: BrowseApartment;
  style: PreviewPlacement;
  /** Plays the exit animation; the owner unmounts the preview once it ends. */
  isClosing: boolean;
  isFavorite: boolean;
  isFavoriteLoading: boolean;
  onFavoritePress: () => void;
  onViewDetails: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onDismiss: () => void;
  matchLabels?: string[];
}

// One icon size, stroke and gap for every stat, so bed, bath and area read as a set.
function Stat({ icon: StatIcon, label }: { icon: Icon; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <StatIcon size={14} stroke={1.75} aria-hidden="true" className="shrink-0" />
      {label}
    </span>
  );
}

export default function ApartmentHoverPreview({
  apartment,
  style,
  isClosing,
  isFavorite,
  isFavoriteLoading,
  onFavoritePress,
  onViewDetails,
  onMouseEnter,
  onMouseLeave,
  onDismiss,
  matchLabels = [],
}: ApartmentHoverPreviewProps) {
  const { fromScale, ...position } = style;
  const hasStats =
    apartment.bedrooms !== undefined ||
    apartment.bathrooms !== undefined ||
    apartment.areaSqm !== undefined;

  // The preview grows out of the card it covers (`fromScale`) and shrinks back
  // into it on exit; see .apt-hover-preview in globals.css.
  return (
    <div
      role="dialog"
      aria-label={`Quick preview of ${apartment.name}`}
      className="apt-hover-preview fixed z-50"
      data-closing={isClosing ? "true" : undefined}
      style={{ ...position, "--hover-from-scale": fromScale } as CSSProperties}
      onMouseEnter={onMouseEnter}
      onMouseLeave={(event) => {
        // Pointer-over on the next card runs before mouse-leave on this overlay.
        // Do not cancel that card's newly started dwell timer.
        if ((event.relatedTarget as Element | null)?.closest?.("[data-preview-card]")) return;
        onMouseLeave();
      }}
      onFocusCapture={onMouseEnter}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) onMouseLeave();
      }}
      onPointerMove={(event) => {
        // Fixed overlays can cover a source/neighbor heart. Yield to the real
        // control at this coordinate, not a raised z-index or an invisible proxy.
        if (document.elementsFromPoint(event.clientX, event.clientY).some(
          (element) => !event.currentTarget.contains(element) && element.closest("[data-apartment-favorite]"),
        )) onDismiss();
      }}
    >
      <div
        className="rounded-xl"
      >
        <Card className="relative max-h-[calc(100dvh-1rem)] overflow-y-auto rounded-xl border border-divider bg-surface p-0 shadow-xl transition-colors duration-200 hover:border-primary">
          <Image
            src={apartment.image}
            alt=""
            width={640}
            height={360}
            sizes="320px"
            unoptimized={!canOptimizePublicApartmentImage(apartment.image)}
            className="h-40 w-full object-cover"
          />

          {apartment.isVerified ? (
            <StatusChip tone="success" size="sm" className="pointer-events-none absolute top-2 left-2">
              <span className="flex items-center gap-1">
                <IconShieldCheckFilled size={14} aria-hidden="true" />
                Verified
              </span>
            </StatusChip>
          ) : null}

          <span className="absolute top-2 right-2 z-10" onClick={(event) => event.stopPropagation()}>
            <Button
              variant="ghost"
              className="bg-white/75"
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
          </span>

          <div className="p-4">
            <h4 className="line-clamp-2 break-words font-nunito text-lg leading-6 font-semibold text-foreground">{apartment.name}</h4>
            <p className="mt-0.5 truncate text-[13px] leading-5 text-muted-foreground">{apartment.location}</p>

            <div className="mt-3 flex items-end justify-between gap-2">
              <p className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                <span className="font-nunito text-2xl leading-8 font-semibold tabular-nums text-primary">{formatPesoDisplay(apartment.price)}</span>
                <span className="text-xs text-muted-foreground">/ month</span>
              </p>
              <p className="flex shrink-0 items-center gap-1 pb-1 text-xs text-muted-foreground">
                <IconStarFilled size={14} className="text-yellow-400" />
                {apartment.rating === 0 ? "-" : apartment.rating}
              </p>
            </div>

            {hasStats ? (
              <div className="mt-2.5 flex items-center gap-3 text-xs leading-4 text-muted-foreground">
                {apartment.bedrooms !== undefined && <Stat icon={IconBed} label={`${apartment.bedrooms} BR`} />}
                {apartment.bathrooms !== undefined && <Stat icon={IconBath} label={`${apartment.bathrooms} BA`} />}
                {apartment.areaSqm !== undefined && <Stat icon={IconMaximize} label={`${apartment.areaSqm} sqm`} />}
              </div>
            ) : null}

            <PreferenceMatchChips labels={matchLabels} summary />
          </div>
          <Button variant="ghost" data-preview-navigation className="apartment-card-navigation button--bare"
            aria-label={`View details of ${apartment.name}`} onPress={onViewDetails} />
        </Card>
      </div>
    </div>
  );
}
