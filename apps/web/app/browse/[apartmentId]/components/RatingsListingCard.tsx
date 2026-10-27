"use client";

import Image from "next/image";
import Link from "next/link";

import { Card, Chip, Separator } from "@heroui/react";
import { IconArrowRight, IconHome, IconMapPin, IconUser } from "@tabler/icons-react";

import StatusChip from "@/app/components/display/StatusChip";
import { statusToneFor } from "@/lib/status-tone";

interface RatingsListingCardProps {
  name: string;
  status: string | null;
  address: string;
  landlordName: string;
  type: string | null;
  coverImage: string | null;
  listingHref: string;
}

function formatApartmentStatus(status: string | null): string {
  return (status ?? "unknown").replace(/_/g, " ");
}

export default function RatingsListingCard({
  name,
  status,
  address,
  landlordName,
  type,
  coverImage,
  listingHref,
}: RatingsListingCardProps) {
  return (
    <Card className="min-w-0 rounded-3xl border border-border bg-card p-4 shadow-none sm:p-5">
      <div className="flex min-w-0 gap-3 sm:gap-4">
        <div className="size-20 shrink-0 overflow-hidden rounded-2xl sm:size-24">
          <Image
            src={coverImage ?? "/default/default-thumbnail.jpeg"}
            alt={name}
            width={192}
            height={192}
            unoptimized
            className="size-full object-cover"
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          {status && (
            <StatusChip tone={statusToneFor(status)} className="self-start capitalize">
              <Chip.Label className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-current" />
                {formatApartmentStatus(status)}
              </Chip.Label>
            </StatusChip>
          )}

          <h2 className="mt-2 font-nunito text-lg font-semibold leading-snug text-card-foreground line-clamp-2">
            {name}
          </h2>

          <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
            <IconMapPin size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span className="min-w-0 line-clamp-2">{address}</span>
          </p>
        </div>
      </div>

      <Separator className="my-3" />

      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm">
        <dt className="flex items-center gap-1.5 text-muted-foreground">
          <IconUser size={16} className="shrink-0" aria-hidden="true" />
          Landlord
        </dt>
        <dd className="min-w-0 font-medium text-card-foreground">{landlordName}</dd>

        <dt className="flex items-center gap-1.5 text-muted-foreground">
          <IconHome size={16} className="shrink-0" aria-hidden="true" />
          Type
        </dt>
        <dd className="min-w-0 font-medium text-card-foreground">{type ?? "—"}</dd>
      </dl>

      <Link
        href={listingHref}
        className="mt-3 inline-flex w-fit items-center gap-1 rounded-md text-sm font-medium text-brand hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        View listing
        <IconArrowRight size={16} aria-hidden="true" />
      </Link>
    </Card>
  );
}
