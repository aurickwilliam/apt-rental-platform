"use client";

import Image from "next/image";

import { Card, Button, Spinner } from "@heroui/react";

import { Star, Heart } from "lucide-react";
import { IconShieldCheckFilled } from "@tabler/icons-react";

import { formatPesoDisplay } from "@repo/utils";

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

        {isVerified ? (
          <span className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-500">
            <IconShieldCheckFilled size={14} className="text-green-500" />
            Verified
          </span>
        ) : null}

        {showFavoriteButton ? (
          <Button
            variant="ghost"
            className="absolute top-2 right-2 bg-white/75"
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
                ) : (
                  <Heart
                    size={18}
                    className={isFavorite ? "text-red-500" : "text-grey-500"}
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
