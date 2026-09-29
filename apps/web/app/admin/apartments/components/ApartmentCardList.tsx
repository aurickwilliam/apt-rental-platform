import Link from "next/link";
import { IconChevronRight, IconShieldCheckFilled, IconShieldX } from "@tabler/icons-react";
import { Chip } from "@heroui/react";
import ApartmentThumbnail from "./ApartmentThumbnail";
import {
  joinedFormatter,
  verificationChipColor,
  type AdminApartment,
} from "../lib/apartment-display";

interface ApartmentCardListProps {
  apartments: AdminApartment[];
}

export default function ApartmentCardList({
  apartments,
}: ApartmentCardListProps) {
  return (
    <ul className="space-y-2 md:hidden">
      {apartments.map((apartment) => (
        <li key={apartment.id}>
          <Link
            href={`/admin/apartments/${apartment.id}`}
            className="block rounded-xl border border-border bg-card p-3 hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <div className="flex items-center gap-3">
              <ApartmentThumbnail url={apartment.thumbnail_url} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-nunito font-bold">
                  {apartment.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {apartment.city}
                </p>
              </div>
              <IconChevronRight
                size={18}
                className="shrink-0 text-primary"
                aria-hidden="true"
              />
            </div>
            <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="truncate capitalize">
                {apartment.status.replaceAll("_", " ")} ·{" "}
                {joinedFormatter.format(new Date(apartment.created_at))}
              </span>
              <Chip
                size="sm"
                variant="soft"
                color={verificationChipColor(apartment.is_verified)}
                className="shrink-0"
              >
                {apartment.is_verified ? (
                  <IconShieldCheckFilled size={14} aria-hidden="true" />
                ) : (
                  <IconShieldX size={14} aria-hidden="true" />
                )}
                {apartment.is_verified ? "Verified" : "Unverified"}
              </Chip>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
