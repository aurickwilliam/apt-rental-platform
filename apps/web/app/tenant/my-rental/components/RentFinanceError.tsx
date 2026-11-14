"use client";

import { Button } from "@heroui/react";

import DashboardCard from "./DashboardCard";

/**
 * Localized fallback for the payment card only. The apartment, landlord,
 * lease, maintenance and applications around it can already render from the
 * rental context, so a financial read must not blank the whole page.
 */
export default function RentFinanceError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <DashboardCard className="border-danger-200">
      <div role="alert" className="flex flex-col items-center gap-3 px-4 py-8 text-center">
        <p className="font-inter text-sm text-muted-foreground">{message}</p>
        <Button size="sm" className="cursor-pointer" onPress={onRetry}>
          Try again
        </Button>
      </div>
    </DashboardCard>
  );
}
