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
import PaymentMethodChip from "@/app/components/display/PaymentMethodChip";
import StatusChip from "@/app/components/display/StatusChip";
import ZigzagEdge from "@/app/tenant/payment/components/ZigzagEdge";
import type { PaymentStatus } from "@/app/tenant/payment/types";
import { statusVariant } from "@/app/tenant/payment/utils";
import type { LandlordPaymentRecord } from "@/service/landlordPaymentService";
import { receiptData, type ReceiptTone } from "../lib/receiptData";
import { Button } from "@heroui/react";

type StatusIcon = ComponentType<{ size?: number; className?: string }>;

const STATUS_ICONS: Record<PaymentStatus, StatusIcon> = {
  Paid: IconCircleCheck,
  Pending: IconClockHour4,
  Rejected: IconCircleX,
  Failed: IconCircleX,
  Unpaid: IconAlertCircle,
};

const TONE_COLORS: Record<ReceiptTone, string> = {
  success: "text-green-600",
  warning: "text-amber-500",
  danger: "text-red-600",
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
      <Button
        variant="ghost"
        onClick={() => void copy()}
        aria-label={copied ? "Reference copied" : "Copy reference"}
        className="button--bare flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
      >
        {copied ? <IconCheck size={15} className="text-green-600" aria-hidden /> : <IconCopy size={15} aria-hidden />}
      </Button>
    </span>
  );
}

interface PaymentReceiptProps {
  payment: LandlordPaymentRecord;
  /** Rendered under the receipt's lines: the actions, or a closing note. */
  footer: ReactNode;
}

export default function PaymentReceipt({ payment, footer }: PaymentReceiptProps) {
  const data = receiptData(payment);
  const Icon = STATUS_ICONS[data.status];
  const color = TONE_COLORS[data.tone];

  return (
    <div className="mx-auto w-full max-w-[460px]">
      <article
        aria-label={`Receipt for ${data.period}`}
        className="rounded-t-2xl bg-white px-6 pb-14 pt-7 text-zinc-900"
      >
        <header className="flex flex-col items-center text-center">
          <Icon size={44} className={color} aria-hidden />
          <h2 className={`mt-2 font-nunito text-lg font-bold ${color}`}>{data.title}</h2>
          <p className="mt-3 font-nunito text-4xl font-bold tracking-tight text-primary">{data.amount}</p>
          <p className="mt-1 text-sm text-zinc-500">{data.period}</p>
        </header>

        <div className="my-5 border-t border-dashed border-zinc-300" />

        <dl className="space-y-3">
          <Row label="Tenant">{data.tenant}</Row>
          <Row label="Apartment">{data.apartment}</Row>
          <Row label={data.dateLabel}>
            {data.date}
            <span className="block text-xs font-normal text-zinc-500">{data.time}</span>
          </Row>
          <Row label="Method"><PaymentMethodChip method={payment.method} /></Row>
          <Row label="Status">
            <StatusChip size="sm" tone={statusVariant(data.status)} className="text-[11px]">{data.status}</StatusChip>
          </Row>
        </dl>

        {data.breakdown.length > 0 ? (
          <>
            <div className="my-5 border-t border-dashed border-zinc-300" />
            <dl className="space-y-2.5">
              {data.breakdown.map((item) => (
                <Row key={item.label} label={item.label}>{item.value}</Row>
              ))}
              <div className="flex items-center justify-between gap-4 border-t border-zinc-200 pt-2.5">
                <dt className="text-sm font-semibold text-zinc-700">Total</dt>
                <dd className="font-nunito text-sm font-bold text-primary">{data.total}</dd>
              </div>
            </dl>
          </>
        ) : null}

        <div className="my-5 border-t border-dashed border-zinc-300" />

        <dl>
          <Row label="Reference No.">
            <CopyReference value={data.reference} display={data.reference} />
          </Row>
        </dl>

        <div className="mt-6">{footer}</div>
      </article>
      {/* Paper-colored teeth hang below the receipt: a true transparent cut-out, no box-shadow to show through it. */}
      <ZigzagEdge hanging cutColor="#ffffff" depth={10} toothWidth={16} className="-mt-px" />
    </div>
  );
}
