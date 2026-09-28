import Image from "next/image";
import Link from "next/link";
import { Building2, ChevronRight } from "lucide-react";
import type { RecentItem } from "../lib/get-dashboard-data";

interface RecentApartmentCardProps {
  apartment: RecentItem;
}

const dateFormatter = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeZone: "Asia/Manila",
});

export default function RecentApartmentCard({
  apartment,
}: RecentApartmentCardProps) {
  return (
    <Link
      href={apartment.href}
      className="flex items-center gap-3 rounded-3xl bg-muted/50 p-3 transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {apartment.image ? (
        <Image
          src={apartment.image}
          alt=""
          unoptimized
          width={44}
          height={44}
          className="size-11 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Building2 size={19} aria-hidden="true" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-nunito text-sm font-bold">
          {apartment.name}
        </span>
        <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          <span className="truncate">{apartment.detail}</span>
          <span aria-hidden="true" className="shrink-0">
            ·
          </span>
          <time dateTime={apartment.date} className="shrink-0">
            {dateFormatter.format(new Date(apartment.date))}
          </time>
        </span>
      </span>
      <ChevronRight
        size={16}
        className="shrink-0 text-primary"
        aria-hidden="true"
      />
    </Link>
  );
}
