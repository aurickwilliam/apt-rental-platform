"use client";

import Image from "next/image";
import Link from "next/link";
import { IconChevronRight as ChevronRight, IconHome as House, IconMapPin as MapPin } from "@tabler/icons-react";

type RentalHeroProps = {
  name: string;
  address: string;
  imageUrl: string | null;
  descriptionHref: string;
};

// The rented apartment's cover photo with its name, address and a link to
// the full description, mirroring mobile's RentalHero.
export default function RentalHero({ name, address, imageUrl, descriptionHref }: RentalHeroProps) {
  return (
    <div className="relative h-64 overflow-hidden rounded-3xl border border-border bg-muted md:h-80">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={`Photo of ${name}`}
          fill
          unoptimized
          sizes="(max-width: 1024px) 100vw, 66vw"
          className="object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
          <House size={48} aria-hidden="true" />
        </div>
      )}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent"
      />
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-5">
        <p className="truncate font-nunito text-2xl font-bold text-white">{name}</p>
        <p className="flex items-start gap-1.5 font-inter text-sm text-white/90">
          <MapPin size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span className="line-clamp-2">{address}</span>
        </p>
        <Link
          href={descriptionHref}
          className="mt-2 flex w-fit items-center gap-1 rounded-full border border-white/60 px-4 py-1.5 font-inter text-sm font-medium text-white no-underline transition-colors hover:bg-white/10"
        >
          View Description
          <ChevronRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
