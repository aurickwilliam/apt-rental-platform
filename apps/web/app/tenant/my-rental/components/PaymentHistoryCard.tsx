"use client";

import Link from "next/link";
import { Button } from "@heroui/react";
import { IconReceipt } from "@tabler/icons-react";

import { formatPesoDisplay } from "@repo/utils";

import StatusChip from "@/app/components/display/StatusChip";

import type { PaymentHistoryItem, PaymentStatus } from "../types";
import DashboardCard from "./DashboardCard";
import PaymentHistorySkeleton from "./PaymentHistorySkeleton";

/** Rows shown here; the full list and receipts live on the history page. */
const RECENT_PAYMENT_LIMIT = 3;
const CHIP_CLASS = "font-nunito text-[11px] font-semibold";

const STATUS_CHIP: Record<PaymentStatus, { tone: "success" | "warning" | "danger"; label: string }> = {
  paid: { tone: "success", label: "Paid" },
  late: { tone: "danger", label: "Late" },
  rejected: { tone: "danger", label: "Rejected" },
  pending: { tone: "warning", label: "Pending" },
};

interface PaymentHistoryCardProps {
  rows: PaymentHistoryItem[];
  loading: boolean;
  /** Bill or payment read failed: never shown as an empty history. */
  failed: boolean;
  onRetry: () => void;
}

/** The latest payments as a short list that never scrolls sideways. */
export default function PaymentHistoryCard({ rows, loading, failed, onRetry }: PaymentHistoryCardProps) {
  return (
    <DashboardCard>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-nunito text-lg font-semibold text-card-foreground">Recent payments</h2>
        <Link href="/tenant/payment/history" className="cursor-pointer font-inter text-sm font-medium text-primary no-underline hover:underline">
          View all
        </Link>
      </div>
      {loading ? (
        <PaymentHistorySkeleton />
      ) : failed ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <p className="font-inter text-sm text-muted-foreground">
            Payment history could not load. Try again to see your receipts.
          </p>
          <Button size="sm" variant="outline" className="cursor-pointer" onPress={onRetry}>
            Try again
          </Button>
        </div>
      ) : rows.length === 0 ? (
        <p className="py-6 text-center font-inter text-sm text-muted-foreground">No payments recorded yet.</p>
      ) : (
        <ul aria-label="Recent payments" className="divide-y divide-border">
          {rows.slice(0, RECENT_PAYMENT_LIMIT).map((row) => (
            <li key={row.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <IconReceipt size={20} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="break-words font-nunito text-sm font-semibold text-card-foreground">{row.description}</p>
                <p className="font-inter text-xs text-muted-foreground">{row.date}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <p className="font-nunito text-sm font-semibold text-card-foreground">{formatPesoDisplay(row.amount)}</p>
                <StatusChip className={CHIP_CLASS} tone={STATUS_CHIP[row.status].tone}>{STATUS_CHIP[row.status].label}</StatusChip>
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  );
}
