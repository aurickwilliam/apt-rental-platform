"use client";

import Image from "next/image";

import { Button, Card } from "@heroui/react";
import { IconShieldCheckFilled, IconStarFilled, IconX } from "@tabler/icons-react";

import { formatPesoDisplay } from "@repo/utils";

import { canOptimizePublicApartmentImage } from "@/lib/public-apartment-image";

import type { MapApartment } from "../../lib/fetch-map-results";

interface MapPreviewCardProps {
  apartment: MapApartment;
  onOpen: () => void;
  onClose: () => void;
}

// Floating card over the map for the selected pin, like the web counterpart of
// mobile's bottom preview sheet: photo, name, area, rent and rating.
export default function MapPreviewCard({ apartment, onOpen, onClose }: MapPreviewCardProps) {
  const specs = [
    apartment.bedrooms != null ? `${apartment.bedrooms} bed` : null,
    apartment.bathrooms != null ? `${apartment.bathrooms} bath` : null,
    apartment.areaSqm != null ? `${apartment.areaSqm} sqm` : null,
  ].filter(Boolean);

  return (
    <div className="absolute inset-x-3 bottom-3 z-10 mx-auto max-w-sm">
      <Card className="relative cursor-pointer flex-row gap-0 overflow-hidden rounded-2xl p-0 shadow-xl">
        <button
          type="button"
          onClick={onOpen}
          aria-label={`View ${apartment.name}`}
          className="flex min-w-0 flex-1 cursor-pointer items-stretch text-left focus-visible:outline-2 focus-visible:outline-primary"
        >
          <div className="relative w-28 shrink-0 self-stretch">
            <Image
              src={apartment.image}
              alt=""
              fill
              sizes="112px"
              unoptimized={!canOptimizePublicApartmentImage(apartment.image)}
              className="object-cover"
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5 p-3 pr-10">
            <p className="truncate font-nunito text-[15px] font-semibold">{apartment.name}</p>
            <p className="truncate text-xs text-muted-foreground">{apartment.location}</p>
            {specs.length > 0 ? <p className="truncate text-xs text-muted-foreground">{specs.join(" · ")}</p> : null}
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="text-[15px] font-medium text-primary">{formatPesoDisplay(apartment.price)}</p>
              <div className="flex items-center gap-1 text-sm">
                {apartment.isVerified ? (
                  <IconShieldCheckFilled size={16} className="text-green-500" aria-label="Verified" />
                ) : null}
                <IconStarFilled size={16} className="text-yellow-400" />
                {apartment.rating === 0 ? "-" : apartment.rating}
              </div>
            </div>
          </div>
        </button>

        <Button
          isIconOnly
          variant="ghost"
          size="sm"
          onPress={onClose}
          aria-label="Close preview"
          className="absolute top-1.5 right-1.5 cursor-pointer"
        >
          <IconX size={16} />
        </Button>
      </Card>
    </div>
  );
}
