"use client";

import Link from "next/link";
import Image from "next/image";
import { IconMapPin as MapPin, IconPhoto as Photo } from "@tabler/icons-react";
import { formatDate } from "@repo/utils";

import StatusChip from "@/app/components/display/StatusChip";
import { getApplicationStatusStyle } from "@/app/tenant/applications/lib/statusStyles";
import type { TenantApplication } from "@/hooks/use-tenant-applications";
import { applicationDetailHref, rememberApplicationReturn } from "@/lib/application-navigation";
import { canOptimizePublicApartmentImage } from "@/lib/public-apartment-image";

interface ApplicationHistoryRowProps {
  application: TenantApplication;
  /** Where the application page's Back returns to. */
  returnHref: string;
}

/**
 * One application in the history drawer: a small photo, the apartment name
 * with its status, the area and the date. The whole row opens the application.
 */
export default function ApplicationHistoryRow({ application, returnHref }: ApplicationHistoryRowProps) {
  const apartment = application.apartments;
  const style = getApplicationStatusStyle(application.status);
  const StatusIcon = style.Icon;
  const name = apartment?.name ?? "Apartment";
  const area = [apartment?.barangay, apartment?.city].filter(Boolean).join(", ");
  const thumbnailUrl =
    apartment?.apartment_images?.find((image) => image.is_cover)?.url ??
    apartment?.apartment_images?.[0]?.url ??
    null;

  return (
    <Link
      href={applicationDetailHref({ applicationId: application.id, apartmentId: application.apartment_id, returnHref })}
      onClick={() => rememberApplicationReturn(application.id, returnHref)}
      aria-label={`View application for ${name}, ${style.label}`}
      className="flex min-w-0 cursor-pointer items-center gap-3 rounded-2xl border border-border bg-card p-2.5 text-card-foreground no-underline transition-colors hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt=""
            fill
            unoptimized={!canOptimizePublicApartmentImage(thumbnailUrl)}
            sizes="64px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground" aria-hidden="true">
            <Photo size={20} />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="min-w-0 flex-1 truncate font-nunito text-base font-semibold leading-snug">{name}</h3>
          <StatusChip tone={style.chipColor} className="shrink-0 font-nunito font-semibold">
            <span className="flex items-center gap-1">
              <StatusIcon size={14} aria-hidden="true" />
              {style.label}
            </span>
          </StatusChip>
        </div>
        {area && (
          <p className="flex min-w-0 items-center gap-1 font-inter text-xs text-muted-foreground">
            <MapPin size={14} className="shrink-0" aria-hidden="true" />
            <span className="truncate">{area}</span>
          </p>
        )}
        <p className="font-inter text-xs text-muted-foreground">
          Applied {formatDate(application.created_at, "medium")}
        </p>
      </div>
    </Link>
  );
}
