"use client";

import { useState } from "react";
import { Button, Popover } from "@heroui/react";
import { IconCash, IconChevronDown, IconChevronRight, IconCircleCheck } from "@tabler/icons-react";
import { formatPesoDisplay } from "@repo/utils";
import { ledgerPeriodLabel } from "@/lib/landlord-payments-view";
import type { LandlordPaymentRecord } from "@/service/landlordPaymentService";

interface NeedsAttentionCardProps {
  /** Pending cash payments only. Each row opens its receipt, where the landlord confirms or declines. */
  payments: LandlordPaymentRecord[];
  onOpen: (payment: LandlordPaymentRecord) => void;
  /** Names the unit on each row; on when the page lists several units at once. */
  showUnit: boolean;
}

// Sits in the page's title row at a fixed, short height however many payments
// are waiting: the list opens in a scrollable popover instead of growing the
// page. Confirming or rejecting cash stays on the payment's own page, where the
// full receipt is visible, so there is a single place that changes payment status.
export default function NeedsAttentionCard({ payments, showUnit, onOpen }: NeedsAttentionCardProps) {
  const [open, setOpen] = useState(false);
  if (payments.length === 0) {
    return (
      <p className="flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-white">
        <IconCircleCheck size={20} className="shrink-0" aria-hidden="true" />
        You&apos;re all caught up. No cash is waiting for you.
      </p>
    );
  }

  const noun = payments.length === 1 ? "cash payment" : "cash payments";

  return (
    <Popover isOpen={open} onOpenChange={setOpen}>
      <Button
        variant="primary"
        className="h-auto cursor-pointer gap-3 rounded-2xl bg-primary! px-4 py-2.5 text-left text-white! opacity-100! hover:bg-primary/90! data-[pressed=true]:bg-primary/90! aria-expanded:bg-primary!"
        aria-label={`Needs attention: ${payments.length} ${noun} to confirm`}
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/20">
          <IconCash size={20} aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="block font-nunito text-base font-bold leading-tight">Needs attention</span>
          <span className="block text-xs font-normal text-white/85">
            {payments.length} {noun} to confirm
          </span>
        </span>
        <span className="flex min-w-7 items-center justify-center rounded-full bg-white px-2 py-0.5 text-sm font-bold text-primary">
          {payments.length}
        </span>
        <IconChevronDown size={20} strokeWidth={2} aria-hidden="true" />
      </Button>
      <Popover.Content placement="bottom end" className="w-96 max-w-[calc(100vw-2rem)]">
        <Popover.Dialog aria-label="Cash payments to confirm" className="p-3">
          <p className="mb-2 px-1 text-sm text-muted-foreground">
            Confirm these cash payments once you have received the money.
          </p>
          <ul className="max-h-80 space-y-2 overflow-y-auto">
            {payments.map((payment) => (
              <li key={payment.id}>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onOpen(payment);
                  }}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-2xl bg-primary/10 p-3 text-left text-foreground transition-colors hover:bg-primary/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <IconCash size={20} className="shrink-0 text-primary" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                      {formatPesoDisplay(payment.amount ?? 0)}
                      {payment.tenant_name ? ` · ${payment.tenant_name}` : ""}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {showUnit && payment.apartment_name ? `${payment.apartment_name} · ` : ""}
                      {payment.billing_kind === "move_in"
                        ? "Move-in payment"
                        : ledgerPeriodLabel(payment.due_date ?? payment.period_start ?? payment.date)}
                    </span>
                  </span>
                  <IconChevronRight size={16} className="shrink-0 text-muted-foreground" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
