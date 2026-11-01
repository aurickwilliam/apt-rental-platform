"use client";

import Image from "next/image";

import { Button, Spinner } from "@heroui/react";
import { IconHeart, IconHeartFilled, IconShieldCheckFilled, IconStarFilled, IconX } from "@tabler/icons-react";

import { formatPesoDisplay } from "@repo/utils";

import { canOptimizePublicApartmentImage } from "@/lib/public-apartment-image";

import type { MapApartment } from "../../lib/fetch-map-results";

interface MapPreviewCardProps {
  apartment: MapApartment;
  isFavorite: boolean;
  isFavoriteLoading: boolean;
  onToggleFavorite: () => void;
  onOpen: () => void;
  onClose: () => void;
}

// Card that opens beside a selected pin (Airbnb-style): photo with the heart and
// close buttons on it, then name, area, specs, rent and rating.
export default function MapPreviewCard({
  apartment,
  isFavorite,
  isFavoriteLoading,
  onToggleFavorite,
  onOpen,
  onClose,
}: MapPreviewCardProps) {
  const specs = [
    apartment.bedrooms != null ? `${apartment.bedrooms} bed` : null,
    apartment.bathrooms != null ? `${apartment.bathrooms} bath` : null,
    apartment.areaSqm != null ? `${apartment.areaSqm} sqm` : null,
  ].filter(Boolean);

  return (
    <div className="w-72 overflow-hidden rounded-2xl bg-surface text-foreground shadow-2xl ring-1 ring-black/5">
      <div className="relative">
        <Button
          variant="ghost"
          onClick={onOpen}
          aria-label={`View ${apartment.name}`}
          className="button--bare block aspect-[4/3] w-full cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
        >
          <Image
            src={apartment.image}
            alt=""
            width={400}
            height={300}
            unoptimized={!canOptimizePublicApartmentImage(apartment.image)}
            className="size-full object-cover"
          />
        </Button>

        {apartment.isVerified ? (
          <span className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-600">
            <IconShieldCheckFilled size={14} />
            Verified
          </span>
        ) : null}

        <div className="absolute top-2 right-2 flex gap-2">
          <Button
            isIconOnly
            variant="ghost"
            size="sm"
            className="cursor-pointer bg-white/90 shadow-sm"
            aria-label={isFavorite ? "Remove from favorites" : "Save to favorites"}
            isPending={isFavoriteLoading}
            onPress={onToggleFavorite}
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
          <Button
            isIconOnly
            variant="ghost"
            size="sm"
            className="cursor-pointer bg-white/90 shadow-sm"
            aria-label="Close preview"
            onPress={onClose}
          >
            <IconX size={18} className="text-grey-500" />
          </Button>
        </div>
      </div>

      <Button
        variant="ghost"
        onClick={onOpen}
        className="button--bare block w-full cursor-pointer p-3 text-left focus-visible:outline-2 focus-visible:outline-primary"
      >
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 truncate font-nunito text-[15px] font-semibold">{apartment.name}</p>
          <span className="flex shrink-0 items-center gap-1 text-sm">
            <IconStarFilled size={16} className="text-yellow-400" />
            {apartment.rating === 0 ? "-" : apartment.rating}
          </span>
        </div>
        <p className="truncate text-sm text-muted-foreground">{apartment.location}</p>
        {specs.length > 0 ? <p className="truncate text-sm text-muted-foreground">{specs.join(" · ")}</p> : null}
        <p className="mt-1.5 text-[15px] font-medium text-primary">{formatPesoDisplay(apartment.price)}</p>
      </Button>
    </div>
  );
}
