"use client";

import { Button, Card, Separator, Spinner } from "@heroui/react";
import { formatPesoDisplay, periodMonthLabel } from "../utils";

interface PaymentSummaryCardProps {
  month: string;
  year: string;
  dueDate: string;
  monthlyRent: number;
  className?: string;
  onPayPress?: () => void;
  isProcessing?: boolean;
  isDisabled?: boolean;
  activeMethod?: string | null;
}

function formatDueDate(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(d);
}

export default function PaymentSummaryCard({ month, year, dueDate, monthlyRent, className = "", onPayPress, isProcessing = false, isDisabled = false, activeMethod }: PaymentSummaryCardProps) {
  return (
    <Card className={`rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-sm h-full flex flex-col ${className}`}>
      <Card.Header className="px-4 pt-4 pb-0">
        <h3 className="text-base font-nunito font-semibold text-zinc-900 dark:text-zinc-100">Payment Summary</h3>
        <p className="text-xs text-zinc-500">Monthly rent • billed in full</p>
      </Card.Header>
      <Card.Content className="px-4 py-3 space-y-2 flex-1 flex flex-col">
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-500 dark:text-zinc-400">Billing Period</span>
          <span className="font-nunito font-medium text-zinc-900 dark:text-zinc-100">
            {month}, {year}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-500 dark:text-zinc-400">Due Date</span>
          <span className="font-nunito font-medium text-zinc-900 dark:text-zinc-100">{formatDueDate(dueDate)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-500 dark:text-zinc-400">Monthly Rent</span>
          <span className="font-nunito font-medium text-zinc-900 dark:text-zinc-100">{formatPesoDisplay(monthlyRent)}</span>
        </div>

        <Separator className="my-2" />

        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="text-sm font-nunito font-semibold text-primary">Total Payment</span>
          <span className="text-sm font-nunito font-bold text-primary">{formatPesoDisplay(monthlyRent)}</span>
        </div>

        {activeMethod && <p className="text-xs text-zinc-500">Method: {activeMethod}</p>}

        {onPayPress && (
          <Button onPress={onPayPress} isDisabled={isDisabled} className="w-full rounded-full mt-3 font-nunito">
            {isProcessing ? (
              <>
                <Spinner size="sm" color="current" /> Processing…
              </>
            ) : (
              "Pay now"
            )}
          </Button>
        )}
      </Card.Content>
    </Card>
  );
}



