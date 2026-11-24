"use client";

import Link from "next/link";
import Image from "next/image";
import { IconMapPin as MapPin, IconPhoto as Photo } from "@tabler/icons-react";
import { formatDate } from "@repo/utils";

import { getApplicationStatusStyle, type ApplicationStatus } from "@/app/tenant/applications/lib/statusStyles";
import { applicationDetailHref, rememberApplicationReturn } from "@/lib/application-navigation";

import StatusChip from "@/app/components/display/StatusChip";
import { canOptimizePublicApartmentImage } from "@/lib/public-apartment-image";

type Props = {
  id: string;
  status: ApplicationStatus;
  apartmentName: string | null;
  apartmentId: string;
  createdAt: string;
  location: string;
  mobileLocation: string;
  thumbnailUrl: string | null;
  returnHref?: string;
};

export default function ApplicationStatusCard({
  id,
  status,
  apartmentName,
  apartmentId,
  createdAt,
  location,
  mobileLocation,
  thumbnailUrl,
  returnHref,
}: Props) {
  const style = getApplicationStatusStyle(status);
  const Icon = style.Icon;
  const name = apartmentName ?? "Apartment";

  return (
    <article className="w-full min-w-0 overflow-hidden rounded-2xl border border-border bg-card text-card-foreground">
      <div className="flex h-full min-h-24 flex-col items-stretch sm:flex-row">
        <div className="relative h-36 w-full shrink-0 self-stretch bg-muted sm:h-auto sm:w-32">
          {thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt=""
              fill
              unoptimized={!canOptimizePublicApartmentImage(thumbnailUrl)}
              sizes="(max-width: 640px) 100vw, 128px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground" aria-hidden="true">
              <Photo size={24} />
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-4">
          <div className="flex min-w-0 flex-wrap items-start gap-x-3 gap-y-2">
            <h3 className="min-w-0 max-w-full break-words text-lg font-nunito font-semibold leading-snug text-card-foreground">
              {name}
            </h3>
            <StatusChip tone={style.chipColor} className="shrink-0 px-2.5 py-1 text-sm">
              <span className="flex items-center gap-1 font-nunito font-semibold">
                <Icon size={16} aria-hidden="true" />
                {style.label}
              </span>
            </StatusChip>
          </div>

          {location && (
            <div className="flex min-w-0 items-start gap-1 text-sm font-inter text-muted-foreground">
              <MapPin size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span className="min-w-0 break-words sm:hidden">{mobileLocation || location}</span>
              <span className="hidden min-w-0 break-words sm:inline">{location}</span>
            </div>
          )}

          <p className="text-sm font-inter text-muted-foreground">
            Applied {formatDate(createdAt, "medium")}
          </p>
          {style.summary && (
            <p className="text-sm font-inter text-muted-foreground">{style.summary}</p>
          )}

          <Link
            href={applicationDetailHref({ applicationId: id, apartmentId, returnHref })}
            onClick={() => rememberApplicationReturn(id, returnHref ?? "")}
            aria-label={`View application for ${name}`}
            className="button button--secondary mt-auto min-h-11 self-start no-underline"
          >
            View application
          </Link>
        </div>
      </div>
    </article>
  );
}
