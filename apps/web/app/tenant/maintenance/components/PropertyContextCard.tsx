"use client";

import Image from "next/image";
import { Card } from "@heroui/react";
import { IconHome as House, IconMapPin as MapPin, IconUser as User } from "@tabler/icons-react";

type PropertyContextCardProps = {
  apartmentName?: string;
  address?: string;
  landlordName?: string;
  imageUrl?: string | null;
};

export default function PropertyContextCard({
  apartmentName = "No property on file",
  address = "",
  landlordName = "N/A",
  imageUrl = null,
}: PropertyContextCardProps) {
  return (
    <Card className="rounded-2xl border border-border bg-card shadow-sm">
      <Card.Content className="p-4">
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-muted sm:h-28 sm:w-36">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={`Photo of ${apartmentName}`}
              fill
              unoptimized
              sizes="144px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <House size={24} aria-hidden="true" />
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
          <p className="truncate font-nunito text-lg font-bold text-primary">
            {apartmentName}
          </p>
          {address && (
            <p className="flex items-center gap-1.5 font-inter text-sm text-muted-foreground">
              <MapPin size={16} className="shrink-0" aria-hidden="true" />
              <span className="truncate">{address}</span>
            </p>
          )}
          <p className="flex items-center gap-1.5 font-inter text-sm text-muted-foreground">
            <User size={16} className="shrink-0" aria-hidden="true" />
            <span className="truncate">
              Landlord: <span className="font-semibold text-card-foreground">{landlordName}</span>
            </span>
          </p>
        </div>
      </div>
      </Card.Content>
    </Card>
  );
}
