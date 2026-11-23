"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Spinner, useOverlayState } from "@heroui/react";
import {
  IconAlertCircle,
  IconCircleCheck,
  IconCircleX,
  IconClock,
  IconReceipt,
  type Icon,
} from "@tabler/icons-react";

import { formatPesoDisplay } from "@repo/utils";

import StatusChip from "@/app/components/display/StatusChip";
import { usePayment } from "@/hooks/use-payments";

import ReceiptModal from "../../payment/components/ReceiptModal";

import type { PaymentHistoryItem, PaymentStatus } from "../types";
import DashboardCard from "./DashboardCard";
import PaymentHistorySkeleton from "./PaymentHistorySkeleton";

/** Rows shown here; the full list lives on the history page. */
const RECENT_PAYMENT_LIMIT = 3;
const CHIP_CLASS = "font-nunito text-[11px] font-semibold";

const STATUS_CHIP: Record<PaymentStatus, { tone: "success" | "warning" | "danger"; label: string; icon: Icon }> = {
  paid: { tone: "success", label: "Paid", icon: IconCircleCheck },
  late: { tone: "danger", label: "Late", icon: IconAlertCircle },
  rejected: { tone: "danger", label: "Rejected", icon: IconCircleX },
  failed: { tone: "danger", label: "Failed", icon: IconCircleX },
  pending: { tone: "warning", label: "Pending", icon: IconClock },
};

interface PaymentHistoryCardProps {
  rows: PaymentHistoryItem[];
  loading: boolean;
  /** Bill or payment read failed: never shown as an empty history. */
  failed: boolean;
  onRetry: () => void;
}

/**
 * The latest payments as a short list that never scrolls sideways. A row opens
 * that payment's receipt in place: the full record is read only when asked for.
 */
export default function PaymentHistoryCard({ rows, loading, failed, onRetry }: PaymentHistoryCardProps) {
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const receipt = usePayment(receiptId);
  // The hook can still hold the previous payment while the next one loads.
  const receiptPayment = !receipt.loading && receipt.data?.id === receiptId ? receipt.data : null;
  const receiptFailed = receiptId !== null && !receipt.loading && !receiptPayment;
  const closeReceipt = () => setReceiptId(null);
  const receiptState = useOverlayState({
    isOpen: receiptPayment !== null,
    onOpenChange: (open) => {
      if (!open) closeReceipt();
    },
  });

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
        <p className="py-6 text-center font-inter text-sm text-muted-foreground">No completed payments yet.</p>
      ) : (
        <ul aria-label="Recent payments" className="divide-y divide-border">
          {rows.slice(0, RECENT_PAYMENT_LIMIT).map((row) => {
            const chip = STATUS_CHIP[row.status];
            const ChipIcon = chip.icon;
            const opening = receiptId === row.id && receipt.loading;
            return (
              <li key={row.id} className="py-1.5 first:pt-0 last:pb-0">
                <Button
                  variant="ghost"
                  aria-label={`View receipt for ${row.description}, ${chip.label}`}
                  isDisabled={receipt.loading}
                  onPress={() => setReceiptId(row.id)}
                  className="button--bare -mx-2 flex w-[calc(100%+1rem)] cursor-pointer items-center gap-3 rounded-2xl px-2 py-1.5 text-left transition-colors hover:bg-muted/50"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {opening ? <Spinner size="sm" color="accent" /> : <IconReceipt size={20} aria-hidden="true" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block break-words font-nunito text-sm font-semibold text-card-foreground">{row.description}</span>
                    <span className="block font-inter text-xs text-muted-foreground">{row.date}</span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <span className="font-nunito text-sm font-semibold text-card-foreground">{formatPesoDisplay(row.amount)}</span>
                    <StatusChip className={CHIP_CLASS} tone={chip.tone}>
                      <span className="flex items-center gap-1"><ChipIcon size={14} aria-hidden="true" />{chip.label}</span>
                    </StatusChip>
                  </span>
                </Button>
              </li>
            );
          })}
        </ul>
      )}
      {receiptFailed && (
        <p role="alert" className="mt-3 font-inter text-sm text-danger">
          That receipt could not load. Please try again.
        </p>
      )}
      {receiptPayment && (
        <ReceiptModal payment={receiptPayment} state={receiptState} transparent />
      )}
    </DashboardCard>
  );
}
