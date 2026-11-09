"use client";

import Link from "next/link";
import { buttonVariants } from "@heroui/react";
import { IconHome } from "@tabler/icons-react";

import EmptyState from "@/app/components/display/EmptyState";

type TenancyEmptyStateProps = {
  description?: string;
};

export default function TenancyEmptyState({ description }: TenancyEmptyStateProps) {
  return (
    <EmptyState
      framed
      className="py-10"
      icon={IconHome}
      title="No active tenancy yet"
      description={
        description ??
        "You're not currently renting an apartment. Browse verified listings to find your next home."
      }
      action={
        <Link
          href="/tenant/browse"
          className={`${buttonVariants({ size: "sm" })} cursor-pointer no-underline`}
        >
          Browse Listings
        </Link>
      }
    />
  );
}
