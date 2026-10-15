"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@heroui/react";
import { IconMapPin as MapPin, IconPhoto as Photo } from "@tabler/icons-react";
import { formatDate } from "@repo/utils";

import { getApplicationStatusStyle, type ApplicationStatus } from "@/app/tenant/applications/lib/statusStyles";

import StatusChip from "./StatusChip";

type Props = {
  id: string;
  status: ApplicationStatus;
  apartmentName: string | null;
  apartmentId: string;
  createdAt: string;
  location: string;
  thumbnailUrl: string | null;
};

export default function ApplicationStatusCard({
  id,
  status,
  apartmentName,
  apartmentId,
  createdAt,
  location,
  thumbnailUrl,
}: Props) {
  const style = getApplicationStatusStyle(status);
  const Icon = style.Icon;
  const statusVariant = style.chipColor === "default" ? "neutral" : style.chipColor;
  const name = apartmentName ?? "Apartment";

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card text-card-foreground">
      <div className="flex min-h-24 items-stretch">
        <div className="relative w-28 shrink-0 self-stretch bg-muted sm:w-40">
          {thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt=""
              fill
              unoptimized
              sizes="(max-width: 640px) 112px, 160px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <Photo size={24} aria-hidden="true" />
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2 p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="min-w-0 flex-1 truncate text-lg font-nunito font-semibold text-card-foreground">
              {name}
            </p>
            <StatusChip variant={statusVariant} className="px-2.5 py-1 text-sm">
              <span className="flex items-center gap-1 font-nunito font-semibold">
                <Icon size={16} style={{ color: style.iconColor }} aria-hidden="true" />
                {style.label}
              </span>
            </StatusChip>
          </div>

          {location && (
            <div className="flex min-w-0 items-start gap-1 text-sm font-inter text-muted-foreground">
              <MapPin size={16} className="shrink-0" aria-hidden="true" />
              <span className="break-words">{location}</span>
            </div>
          )}

          <p className="text-sm font-inter text-muted-foreground">
            Submitted {formatDate(createdAt, "medium")}
          </p>

          <Link
            href={`/tenant/applications/${id}?apartmentId=${apartmentId}`}
            className="mt-auto self-end no-underline"
          >
            <Button size="sm" variant="secondary">
              View Details
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
