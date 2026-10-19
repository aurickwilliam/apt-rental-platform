"use client";

import { IconCashBanknote } from "@tabler/icons-react";

export default function PaymentsHeader() {
  return (
    <div>
      <h1 className="flex items-center gap-2 font-nunito text-3xl font-bold text-primary">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <IconCashBanknote size={28} aria-hidden="true" />
        </span>
        Payments
      </h1>
      <p className="text-sm text-muted-foreground mt-1">Payments for this unit will appear here.</p>
    </div>
  );
}
