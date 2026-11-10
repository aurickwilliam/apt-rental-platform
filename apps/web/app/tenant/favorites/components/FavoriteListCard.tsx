"use client";

import Image from "next/image";
import Link from "next/link";

import { Button, Card } from "@heroui/react";

import { IconBed as BedDouble, IconBath as Bath, IconMaximize as Expand, IconHeart as Heart, IconMapPin, IconStarFilled } from "@tabler/icons-react";

import { formatPesoDisplay } from "@repo/utils";

import { useTranslation } from "@/app/components/i18n/LocaleProvider";
import type { FavoriteApartment } from "@/service/favoritesService";
import { canOptimizePublicApartmentImage } from "@/lib/public-apartment-image";

interface FavoriteListCardProps {
  apartment: FavoriteApartment;
  thumbnailUrl: string;
  isFavorite: boolean;
  isFavoriteLoading?: boolean;
  onFavoritePress?: () => void;
  href: string;
}

export default function FavoriteListCard({
  apartment,
  thumbnailUrl,
  isFavorite,
  isFavoriteLoading = false,
  onFavoritePress,
  href,
}: FavoriteListCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="favorite-list-card">
      <Card.Content>
        <div className="flex min-w-0 flex-col @min-[36rem]/favorites:flex-row">
          <div className="relative h-48 w-full shrink-0 overflow-hidden bg-muted @min-[36rem]/favorites:h-auto @min-[36rem]/favorites:min-h-48 @min-[36rem]/favorites:w-56">
            <Image
              src={thumbnailUrl}
              alt={apartment.name}
              fill
              unoptimized={!canOptimizePublicApartmentImage(thumbnailUrl)}
              sizes="(max-width: 768px) 100vw, 224px"
              className="object-cover"
            />
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-4 p-5">
            <div className="min-w-0 space-y-1 pr-10">
              <h3 className="break-words font-nunito text-lg font-bold text-card-foreground">
                {apartment.name}
              </h3>
              <p className="flex items-start gap-1 text-sm text-muted-foreground">
                <IconMapPin size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                <span className="min-w-0 break-words">
                  {apartment.barangay}, {apartment.city}
                </span>
              </p>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <BedDouble size={16} aria-hidden="true" />
                {apartment.no_bedrooms === 1
                  ? t("favorites.card.bedroom", { count: apartment.no_bedrooms ?? 0 })
                  : t("favorites.card.bedroomPlural", { count: apartment.no_bedrooms ?? 0 })}
              </span>
              <span className="inline-flex items-center gap-1">
                <Bath size={16} aria-hidden="true" />
                {apartment.no_bathrooms === 1
                  ? t("favorites.card.bathroom", { count: apartment.no_bathrooms ?? 0 })
                  : t("favorites.card.bathroomPlural", { count: apartment.no_bathrooms ?? 0 })}
              </span>
              <span className="inline-flex items-center gap-1">
                <Expand size={16} aria-hidden="true" />
                {t("favorites.card.sqm", { count: apartment.area_sqm ?? 0 })}
              </span>
            </div>
            <div className="mt-auto flex flex-wrap items-end justify-between gap-3 border-t border-border pt-4">
              <p className="font-nunito text-xl font-bold text-primary">
                {formatPesoDisplay(apartment.monthly_rent ?? 0)}
                <span className="ml-1 font-inter text-xs font-normal text-muted-foreground">{t("favorites.card.perMonth")}</span>
              </p>
              <span className="inline-flex items-center gap-1 text-sm text-card-foreground">
                <IconStarFilled size={16} className="text-rating" aria-hidden="true" />
                {apartment.average_rating ? apartment.average_rating : t("favorites.card.noRatings")}
              </span>
            </div>
          </div>
        </div>
      </Card.Content>
      <Link
        href={href}
        aria-label={t("common.viewAria", { name: apartment.name })}
        className="absolute inset-0 z-10 rounded-2xl focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
      />
      <div className="absolute right-3 top-3 z-20">
        <Button
          isIconOnly
          variant="ghost"
          className="favorite-list-heart"
          aria-label={isFavorite ? t("favorites.remove.aria") : t("favorites.save.aria")}
          isPending={isFavoriteLoading}
          onPress={onFavoritePress}
        >
          <Heart size={18} className={isFavorite ? "text-danger" : "text-muted-foreground"} fill={isFavorite ? "currentColor" : "none"} />
        </Button>
      </div>
    </Card>
  );
}
