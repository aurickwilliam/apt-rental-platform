"use client";

import Image from "next/image";

import { motion, useReducedMotion } from "framer-motion";
import { Button, Card, Spinner } from "@heroui/react";
import { Bath, BedDouble, Heart, Ruler, Star } from "lucide-react";
import { IconShieldCheckFilled } from "@tabler/icons-react";

import { formatPesoDisplay } from "@repo/utils";
import type { BrowseApartment } from "../lib/fetch-browse-results";

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
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      role="dialog"
      aria-label={`Quick preview of ${apartment.name}`}
      className="fixed z-50 hidden md:block"
      style={style}
      initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.92, y: reduceMotion ? 0 : 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.96, y: reduceMotion ? 0 : 4 }}
      transition={{ duration: reduceMotion ? 0 : 0.18, ease: "easeOut" }}
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
            unoptimized
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
              <Star className="text-yellow-400" fill="currentColor" size={16} />
              {apartment.rating === 0 ? "-" : apartment.rating}
            </p>
          </div>

          {apartment.bedrooms !== undefined ||
          apartment.bathrooms !== undefined ||
          apartment.areaSqm !== undefined ? (
            <div className="flex items-center gap-3 text-xs text-default-500">
              {apartment.bedrooms !== undefined && (
                <span className="flex items-center gap-1">
                  <BedDouble size={14} />
                  {apartment.bedrooms} BR
                </span>
              )}
              {apartment.bathrooms !== undefined && (
                <span className="flex items-center gap-1">
                  <Bath size={14} />
                  {apartment.bathrooms} BA
                </span>
              )}
              {apartment.areaSqm !== undefined && (
                <span className="flex items-center gap-1">
                  <Ruler size={14} />
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
                ) : (
                  <Heart
                    size={18}
                    className={isFavorite ? "text-red-500" : "text-grey-500"}
                    fill={isFavorite ? "currentColor" : "none"}
                  />
                )
              }
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
