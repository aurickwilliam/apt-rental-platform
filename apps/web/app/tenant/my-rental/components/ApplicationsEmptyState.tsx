"use client";

import { buttonVariants } from "@heroui/react";
import Link from "next/link";
import { IconClipboardX } from "@tabler/icons-react";

import EmptyState from "@/app/components/display/EmptyState";

export default function ApplicationsEmptyState() {
  return (
    <EmptyState
      framed
      className="py-10"
      icon={IconClipboardX}
      title="No Applications Yet"
      description="You haven't applied to any apartment yet. Browse listings and submit an application to get started."
      action={
        <Link
          href="/browse"
          className={`${buttonVariants({ size: "sm" })} cursor-pointer no-underline`}
        >
          Browse Listings
        </Link>
      }
    />
  );
}
