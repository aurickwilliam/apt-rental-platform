"use client";

import Image from "next/image";
import { Button, Card, CardBody } from "@heroui/react";
import { BedDouble, Bath, Expand, Heart } from "lucide-react";

import { formatCurrency } from "@repo/utils";
import type { FavoriteApartment } from "@/service/favoritesService";

interface FavoriteListCardProps {
  apartment: FavoriteApartment;
  thumbnailUrl: string;
  isFavorite: boolean;
  isFavoriteLoading?: boolean;
  onFavoritePress?: () => void;
  onPress?: () => void;
}

export default function FavoriteListCard({
  apartment,
  thumbnailUrl,
  isFavorite,
  isFavoriteLoading = false,
  onFavoritePress,
  onPress,
}: FavoriteListCardProps) {
  return (
    <Card shadow="none" className="border border-default-200">
      <CardBody className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div
            className="relative h-40 w-full overflow-hidden rounded-xl sm:h-28 sm:w-44"
            onClick={onPress}
            onKeyDown={(event) => {
              if (event.key === "Enter") onPress?.();
            }}
            role={onPress ? "button" : undefined}
            tabIndex={onPress ? 0 : -1}
          >
            <Image
              src={thumbnailUrl}
              alt={apartment.name}
              fill
              className="object-cover"
            />
          </div>

          <div className="flex-1">
            <div className="flex flex-col gap-1">
              <h3
                className="text-lg font-semibold text-foreground cursor-pointer"
                onClick={onPress}
                onKeyDown={(event) => {
                  if (event.key === "Enter") onPress?.();
                }}
                role={onPress ? "button" : undefined}
                tabIndex={onPress ? 0 : -1}
              >
                {apartment.name}
              </h3>
              <p className="text-sm text-default-500">
                {apartment.barangay}, {apartment.city}
              </p>
            </div>

            <div className="mt-3 flex flex-wrap gap-3 text-sm text-default-500">
              <span className="inline-flex items-center gap-1">
                <BedDouble size={16} />
                {apartment.no_bedrooms ?? 0} Bedrooms
              </span>
              <span className="inline-flex items-center gap-1">
                <Bath size={16} />
                {apartment.no_bathrooms ?? 0} Bathrooms
              </span>
              <span className="inline-flex items-center gap-1">
                <Expand size={16} />
                {apartment.area_sqm ?? 0} sqm
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between sm:flex-col sm:items-end sm:justify-center gap-3">
            <p className="text-lg font-semibold text-primary">
              ₱ {formatCurrency(apartment.monthly_rent ?? 0)}
            </p>
            <Button
              isIconOnly
              radius="full"
              variant="flat"
              color={isFavorite ? "danger" : "default"}
              isLoading={isFavoriteLoading}
              onPress={onFavoritePress}
            >
              <Heart
                size={18}
                className={isFavorite ? "text-red-500" : "text-default-500"}
                fill={isFavorite ? "currentColor" : "none"}
              />
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
