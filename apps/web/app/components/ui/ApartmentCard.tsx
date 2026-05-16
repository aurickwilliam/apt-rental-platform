"use client";

import { Card, Button, Spinner } from "@heroui/react";
import Image from "next/image";
import { Star, Heart } from "lucide-react";
import { formatCurrency } from "@repo/utils";
import { div } from "framer-motion/client";

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
      <Card className="bg-white rounded-xl shadow-sm overflow-hidden w-56 h-full relative">
        <Card.Content className="p-0">
          <Image
            src={thumbnailUrl}
            alt="Apartment Thumbnail"
            width={300}
            height={200}
            className="rounded-xl object-cover size-56"
          />

          <div className="p-2">
            <h3 className="text-base font-semibold truncate">{name}</h3>

            <div className="flex items-center gap-1">
              <p className="text-gray-600 text-sm">{location}</p>
            </div>
          </div>
        </Card.Content>

        <Card.Footer className="p-2 flex justify-between items-center">
          <p className="text-base font-medium text-primary">
            ₱ {formatCurrency(price)}
          </p>

          <div className="flex items-center gap-1">
            <Star className="text-yellow-400" fill="currentColor" size={18} />
            <p className="text-sm">{rating === 0 ? "-" : rating}</p>
          </div>
        </Card.Footer>

        {showFavoriteButton ? (
          <Button
            variant="ghost"
            className="absolute top-2 right-2 bg-black/30"
            isIconOnly
            isPending={isFavoriteLoading}
            onPress={(e) => {
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