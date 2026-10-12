"use client";

import type { ReactNode } from "react";
import { Spinner } from "@heroui/react";

interface PendingListProps {
  isPending: boolean;
  label: string;
  children: ReactNode;
}

/**
 * Keeps the current results visible while new ones load: the list dims and a
 * small spinner fades in, both after a short delay so fast responses don't
 * flash.
 */
export default function PendingList({
  isPending,
  label,
  children,
}: PendingListProps) {
  return (
    <div aria-busy={isPending} className="relative">
      <div
        className={
          isPending
            ? "pointer-events-none opacity-50 transition-opacity delay-150 duration-200"
            : "transition-opacity duration-150"
        }
      >
        {children}
      </div>
      {isPending ? (
        <div className="absolute inset-x-0 top-20 flex justify-center opacity-100 transition-opacity delay-300 duration-200 starting:opacity-0">
          <Spinner
            size="md"
            color="current"
            className="text-primary"
            aria-label={label}
          />
        </div>
      ) : null}
    </div>
  );
}
