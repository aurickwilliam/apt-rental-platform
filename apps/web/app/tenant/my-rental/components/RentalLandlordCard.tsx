"use client";

import Link from "next/link";
import { buttonVariants } from "@heroui/react";
import { IconMessageCircle } from "@tabler/icons-react";

import UserAvatar from "@/app/components/profile/UserAvatar";
import type { TenancyLandlord } from "@/hooks/use-tenancy";

import { formatLandlordName, getInitials } from "../utils";
import DashboardCard from "./DashboardCard";

interface RentalLandlordCardProps {
  landlord: TenancyLandlord;
  /** Public profile in the tenant shell. */
  profileHref: string;
  /** The conversation about this rental. */
  messageHref: string;
}

/** Mobile's LandlordCard: avatar and name open the profile, the icon button messages. */
export default function RentalLandlordCard({ landlord, profileHref, messageHref }: RentalLandlordCardProps) {
  const name = formatLandlordName(landlord);
  return (
    <DashboardCard>
      <div className="flex items-center gap-3">
        <Link
          href={profileHref}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-2xl no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <UserAvatar
            src={landlord.avatar_url}
            initials={getInitials(name)}
            alt={name}
            size="lg"
            fallbackClassName="bg-primary text-white"
          />
          <span className="min-w-0">
            <span className="block truncate font-nunito text-base font-semibold text-card-foreground">{name}</span>
            <span className="block truncate font-inter text-xs text-muted-foreground">Landlord</span>
          </span>
        </Link>
        <Link
          href={messageHref}
          aria-label={`Message ${name}`}
          className={`${buttonVariants({ variant: "secondary", isIconOnly: true })} cursor-pointer no-underline`}
        >
          <IconMessageCircle size={22} aria-hidden="true" />
        </Link>
      </div>
    </DashboardCard>
  );
}
