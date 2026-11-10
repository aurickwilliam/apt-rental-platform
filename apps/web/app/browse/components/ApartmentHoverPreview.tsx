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
import { useTranslation } from "@/app/components/i18n/LocaleProvider";
import StatusChip from "@/app/components/display/StatusChip";
import type { BrowseApartment } from "../lib/fetch-browse-results";
import { canOptimizePublicApartmentImage } from "@/lib/public-apartment-image";
import type { PreviewPlacement } from "./use-hover-preview";

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
}

// One icon size, stroke and gap for every stat, so bed, bath and area read as a set.
function Stat({ icon: StatIcon, label }: { icon: Icon; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <StatIcon size={16} stroke={1.75} aria-hidden="true" className="shrink-0" />
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
}: ApartmentHoverPreviewProps) {
  const { t } = useTranslation();
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
      aria-label={t("browse.preview.quickAria", { name: apartment.name })}
      className="apt-hover-preview fixed z-50 hidden md:block"
      data-closing={isClosing ? "true" : undefined}
      style={{ ...position, "--hover-from-scale": fromScale } as CSSProperties}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        className="cursor-pointer rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        role="button"
        tabIndex={0}
        aria-label={t("browse.preview.viewDetailsAria", { name: apartment.name })}
        onClick={onViewDetails}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onViewDetails();
          }
        }}
      >
        <Card className="relative overflow-hidden rounded-xl border border-divider bg-surface p-0 shadow-xl transition-colors duration-200 hover:border-primary">
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
            <StatusChip tone="success" size="sm" className="absolute top-2 left-2">
              <span className="flex items-center gap-1">
                <IconShieldCheckFilled size={14} aria-hidden="true" />
                {t("browse.preview.verified")}
              </span>
            </StatusChip>
          ) : null}

          <span className="absolute top-2 right-2" onClick={(event) => event.stopPropagation()}>
            <Button
              variant="ghost"
              className="bg-white/75"
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
          </span>

          <div className="flex flex-col gap-1.5 p-3">
            <h4 className="truncate text-base font-semibold">{apartment.name}</h4>
            <p className="truncate text-xs text-default-500">{apartment.location}</p>

            {hasStats ? (
              <div className="mt-0.5 flex items-center gap-4 text-xs text-default-500">
                {apartment.bedrooms !== undefined && <Stat icon={IconBed} label={t("browse.preview.bedrooms", { count: apartment.bedrooms })} />}
                {apartment.bathrooms !== undefined && <Stat icon={IconBath} label={t("browse.preview.bathrooms", { count: apartment.bathrooms })} />}
                {apartment.areaSqm !== undefined && <Stat icon={IconMaximize} label={t("browse.preview.sqm", { count: apartment.areaSqm })} />}
              </div>
            ) : null}

            <div className="mt-1.5 flex items-center justify-between">
              <p className="text-xl font-semibold text-primary">{formatPesoDisplay(apartment.price)}</p>
              <p className="flex items-center gap-1 text-sm">
                <IconStarFilled size={16} className="text-yellow-400" />
                {apartment.rating === 0 ? "-" : apartment.rating}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
