"use client";

import type { ReactNode } from "react";
import { IconCashBanknote } from "@tabler/icons-react";

interface PaymentsHeaderProps {
  /** Controls on the right of the title row (the unit picker). */
  children?: ReactNode;
}

export default function PaymentsHeader({ children }: PaymentsHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="flex items-center gap-2 font-nunito text-3xl font-bold text-primary">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <IconCashBanknote size={28} aria-hidden="true" />
          </span>
          Payments
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Rent and fees collected for each of your units.</p>
      </div>
      {children}
    </div>
  );
}
