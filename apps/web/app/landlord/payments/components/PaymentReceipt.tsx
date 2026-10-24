"use client";

import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import {
  IconAlertCircle,
  IconCheck,
  IconCircleCheck,
  IconCircleX,
  IconClockHour4,
  IconCopy,
} from "@tabler/icons-react";
import { formatPesoDisplay, paymentBreakdown } from "@repo/utils";
import PaymentMethodChip from "@/app/components/display/PaymentMethodChip";
import StatusChip from "@/app/components/display/StatusChip";
import ZigzagEdge from "@/app/tenant/payment/components/ZigzagEdge";
import type { PaymentStatus } from "@/app/tenant/payment/types";
import {
  formatDateFull,
  formatReferenceId,
  formatTimeShort,
  paymentStatusLabel,
  statusVariant,
} from "@/app/tenant/payment/utils";
import { ledgerPeriodLabel } from "@/lib/landlord-payments-view";
import type { LandlordPaymentRecord } from "@/service/landlordPaymentService";

type StatusMeta = { icon: ComponentType<{ size?: number; className?: string }>; color: string; title: string };

// Worded for the landlord reading it, not the tenant who paid.
const STATUS_META: Record<PaymentStatus, StatusMeta> = {
  Paid: { icon: IconCircleCheck, color: "text-green-600", title: "Payment received" },
  Pending: { icon: IconClockHour4, color: "text-amber-500", title: "Payment pending" },
  Rejected: { icon: IconCircleX, color: "text-red-600", title: "Payment declined" },
  Failed: { icon: IconCircleX, color: "text-red-600", title: "Payment failed" },
  Unpaid: { icon: IconAlertCircle, color: "text-red-600", title: "Unpaid" },
};

const COPIED_MS = 1800;

// The receipt is an always-white paper surface, so its colors are fixed
// light-surface values instead of dark: variants.
function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="shrink-0 text-sm text-zinc-500">{label}</dt>
      <dd className="min-w-0 text-right text-sm font-nunito font-semibold text-zinc-900">{children}</dd>
    </div>
  );
}

function CopyReference({ value, display }: { value: string; display: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), COPIED_MS);
    } catch {
      // Clipboard access can be refused; the reference stays selectable on screen.
      console.error("The reference could not be copied.");
    }
  };

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="select-all break-all font-mono text-[13px] tracking-wide">{display}</span>
      <button
        type="button"
        onClick={() => void copy()}
        aria-label={copied ? "Reference copied" : "Copy reference"}
        className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
      >
        {copied ? <IconCheck size={15} className="text-green-600" aria-hidden /> : <IconCopy size={15} aria-hidden />}
      </button>
    </span>
  );
}

interface PaymentReceiptProps {
  payment: LandlordPaymentRecord;
  /** Rendered under the receipt's lines: the actions, or a closing note. */
  footer: ReactNode;
}

export default function PaymentReceipt({ payment, footer }: PaymentReceiptProps) {
  const status = paymentStatusLabel(payment.status);
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  const isMoveIn = payment.billing_kind === "move_in";
  const period = isMoveIn ? "Move-in payment" : ledgerPeriodLabel(payment.due_date ?? payment.period_start ?? payment.date);
  const breakdown = paymentBreakdown(payment);
  const paidLabel = status === "Paid" ? "Paid on" : "Recorded on";

  return (
    <div className="mx-auto w-full max-w-[460px]">
      <article
        aria-label={`Receipt for ${period}`}
        className="rounded-t-2xl bg-white px-6 pb-14 pt-7 text-zinc-900"
      >
        <header className="flex flex-col items-center text-center">
          <Icon size={44} className={meta.color} aria-hidden />
          <h2 className={`mt-2 font-nunito text-lg font-bold ${meta.color}`}>{meta.title}</h2>
          <p className="mt-3 font-nunito text-4xl font-bold tracking-tight text-primary">{formatPesoDisplay(payment.amount ?? 0)}</p>
          <p className="mt-1 text-sm text-zinc-500">{period}</p>
        </header>

        <div className="my-5 border-t border-dashed border-zinc-300" />

        <dl className="space-y-3">
          <Row label="Tenant">{payment.tenant_name ?? "—"}</Row>
          <Row label="Apartment">{payment.apartment_name ?? "—"}</Row>
          <Row label={paidLabel}>
            {formatDateFull(payment.date)}
            <span className="block text-xs font-normal text-zinc-500">{formatTimeShort(payment.created_at)}</span>
          </Row>
          <Row label="Method"><PaymentMethodChip method={payment.method} /></Row>
          <Row label="Status">
            <StatusChip size="sm" tone={statusVariant(status)} className="text-[11px]">{status}</StatusChip>
          </Row>
        </dl>

        {breakdown.length > 0 ? (
          <>
            <div className="my-5 border-t border-dashed border-zinc-300" />
            <dl className="space-y-2.5">
              {breakdown.map((item) => (
                <Row key={item.label} label={item.label}>{formatPesoDisplay(item.amount)}</Row>
              ))}
              <div className="flex items-center justify-between gap-4 border-t border-zinc-200 pt-2.5">
                <dt className="text-sm font-semibold text-zinc-700">Total</dt>
                <dd className="font-nunito text-sm font-bold text-primary">{formatPesoDisplay(payment.amount ?? 0)}</dd>
              </div>
            </dl>
          </>
        ) : null}

        <div className="my-5 border-t border-dashed border-zinc-300" />

        <dl>
          <Row label="Reference No.">
            <CopyReference value={formatReferenceId(payment.reference_id)} display={formatReferenceId(payment.reference_id)} />
          </Row>
        </dl>

        <div className="mt-6">{footer}</div>
      </article>
      {/* Paper-colored teeth hang below the receipt: a true transparent cut-out, no box-shadow to show through it. */}
      <ZigzagEdge hanging cutColor="#ffffff" depth={10} toothWidth={16} className="-mt-px" />
    </div>
  );
}
