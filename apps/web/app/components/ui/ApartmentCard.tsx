"use client";

import Image from "next/image";

import { Card, Button, Spinner } from "@heroui/react";

import { Star, Heart } from "lucide-react";

import { formatPesoDisplay } from "@repo/utils";

interface ApartmentCardProps {
  name: string;
  location: string;
  price: number;
  rating: number;
  thumbnailUrl: string;
  onPress?: () => void;
  isFavorite?: boolean;
  isFavoriteLoading?: boolean;
  onFavoritePress?: () => void;
}

export default function ApartmentCard({
  name,
  location,
  price,
  rating,
  thumbnailUrl,
  onPress,
  isFavorite = false,
  isFavoriteLoading = false,
  onFavoritePress,
}: ApartmentCardProps) {
  const showFavoriteButton = Boolean(onFavoritePress);

  return (
    <div
      className="cursor-pointer"
      onClick={onPress}
      role="button"
    >
      <Card className="bg-surface border border-transparent hover:border-primary transition-all duration-200 rounded-xl overflow-hidden w-56 h-full relative p-0">
        <div>
          <Image
            src={thumbnailUrl}
            alt="Apartment Thumbnail"
            width={300}
            height={200}
            className="object-cover rounded-xl size-56"
          />

          <div className="p-2">
            <h3 className="text-[15px] font-semibold truncate">
              {name}
            </h3>

            <div className="flex items-center gap-1">
              <p className="bg-surface-variant text-xs">
                {location}
              </p>
            </div>
          </div>
        </div>

        <Card.Footer className="p-2 flex justify-between items-center">
          <p className="text-[15px] font-medium text-primary">
            {formatPesoDisplay(price)}
          </p>

          <div className="flex items-center gap-1">
            <Star className="text-yellow-400" fill="currentColor" size={18} />
            <p className="text-sm">
              {rating === 0 ? "-" : rating}
            </p>
          </div>
        </Card.Footer>

        {showFavoriteButton ? (
          <Button
            variant="ghost"
            className="absolute top-2 right-2 bg-black/30"
            isIconOnly
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
                ) : (
                  <Heart
                    className={isFavorite ? "text-red-500" : "text-white"}
                    fill={isFavorite ? "currentColor" : "none"}
                  />
                )}
              </>
            )}
          </Button>
        ) : null}
      </Card>
    </div>
  );
}
