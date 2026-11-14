"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { canOptimizePublicApartmentImage } from "@/lib/public-apartment-image";
import { IconBuildingSkyscraper, IconMapPinFilled } from "@tabler/icons-react";

type RentalHeroProps = {
  name: string;
  address: string;
  imageUrl: string | null;
  descriptionHref: string;
  /** Pinned over the photo's top-right corner (mobile puts the bell there). */
  topRight?: ReactNode;
};

// Dark at the top for the corner badge, clear briefly, then dark under the
// text so it stays readable on bright photos: mobile's RentalHero scrim.
const HERO_SCRIM =
  "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.85) 100%)";

// The rented apartment's cover photo with its name, address and an underlined
// "View Description" link, mirroring mobile's RentalHero.
export default function RentalHero({ name, address, imageUrl, descriptionHref, topRight }: RentalHeroProps) {
  return (
    <section aria-label={`${name} rental`} className="relative h-60 overflow-hidden rounded-3xl bg-primary sm:h-72 @min-[56rem]/rental:h-full @min-[56rem]/rental:min-h-80">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={`Photo of ${name}`}
          fill
          priority
          unoptimized={!canOptimizePublicApartmentImage(imageUrl)}
          sizes="(max-width: 1024px) 100vw, 66vw"
          className="object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-white/60">
          <IconBuildingSkyscraper size={48} aria-hidden="true" />
        </div>
      )}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ backgroundImage: HERO_SCRIM }} />
      {topRight ? <div className="absolute right-4 top-4 flex flex-wrap items-center justify-end gap-2">{topRight}</div> : null}
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 px-5 pb-5 sm:px-6 sm:pb-6">
        <h1 className="line-clamp-2 break-words font-nunito text-2xl font-bold text-white">{name}</h1>
        <p className="flex items-start gap-1.5 font-inter text-sm text-white/90">
          <IconMapPinFilled size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span className="line-clamp-2">{address}</span>
        </p>
        <Link
          href={descriptionHref}
          className="mt-1 w-fit cursor-pointer font-inter text-sm text-white underline underline-offset-2 hover:text-white/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          View Description
        </Link>
      </div>
    </section>
  );
}
