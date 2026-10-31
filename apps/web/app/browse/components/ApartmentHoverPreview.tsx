"use client";

import Image from "next/image";

import { Button, Card, Spinner } from "@heroui/react";
import {
  IconBath,
  IconBed,
  IconHeart,
  IconHeartFilled,
  IconRuler,
  IconShieldCheckFilled,
  IconStarFilled,
} from "@tabler/icons-react";

import { formatPesoDisplay } from "@repo/utils";
import { useTranslation } from "@/app/components/i18n/LocaleProvider";
import type { BrowseApartment } from "../lib/fetch-browse-results";
import { canOptimizePublicApartmentImage } from "@/lib/public-apartment-image";

interface ApartmentHoverPreviewProps {
  apartment: BrowseApartment;
  style: { left: number; top: number; width: number };
  isFavorite: boolean;
  isFavoriteLoading: boolean;
  onFavoritePress: () => void;
  onViewDetails: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export default function ApartmentHoverPreview({
  apartment,
  style,
  isFavorite,
  isFavoriteLoading,
  onFavoritePress,
  onViewDetails,
  onMouseEnter,
  onMouseLeave,
}: ApartmentHoverPreviewProps) {
  const { t } = useTranslation();
  // CSS-only enter animation (no motion library): fade + slight zoom on
  // mount, instant unmount. Respects reduced-motion preferences.
  return (
    <div
      role="dialog"
      aria-label={t("browse.preview.quickAria", { name: apartment.name })}
      className="fixed z-50 hidden animate-in fade-in-0 zoom-in-95 duration-180 motion-reduce:animate-none md:block"
      style={style}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <Card className="overflow-hidden rounded-xl border border-divider bg-surface p-0 shadow-xl">
        <div className="relative">
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
              {t("browse.preview.verified")}
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
                  {t("browse.preview.bedrooms", { count: apartment.bedrooms })}
                </span>
              )}
              {apartment.bathrooms !== undefined && (
                <span className="flex items-center gap-1">
                  <IconBath size={14} />
                  {t("browse.preview.bathrooms", { count: apartment.bathrooms })}
                </span>
              )}
              {apartment.areaSqm !== undefined && (
                <span className="flex items-center gap-1">
                  <IconRuler size={14} />
                  {t("browse.preview.sqm", { count: apartment.areaSqm })}
                </span>
              )}
            </div>
          ) : null}

          <div className="mt-1 flex items-center gap-2">
            <Button
              size="sm"
              className="flex-1"
              onPress={onViewDetails}
              aria-label={t("browse.preview.viewDetailsAria", { name: apartment.name })}
            >
              {t("browse.preview.viewDetails")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              isIconOnly
              aria-label={isFavorite ? t("favorites.remove.aria") : t("favorites.save.aria")}
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
    </div>
  );
}
