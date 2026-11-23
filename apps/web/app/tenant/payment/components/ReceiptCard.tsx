"use client";

import type { ReactNode } from "react";
import { Card } from "@heroui/react";
import { IconCircleCheck as CheckCircle2, IconAlertCircle as AlertCircle, IconCircleX as XCircle } from "@tabler/icons-react";
import { formatPesoDisplay } from "../utils";
import type { PaymentStatus } from "../types";
import ZigzagEdge from "./ZigzagEdge";

const STATUS_META: Record<PaymentStatus, { icon: typeof CheckCircle2; color: string; title: string; footer: string; badge: string }> = {
  Paid: { icon: CheckCircle2, color: "text-green-600", title: "Payment Successful", footer: "Thank you for your payment!", badge: "Paid" },
  Pending: { icon: AlertCircle, color: "text-amber-500", title: "Payment Pending", footer: "Awaiting payment confirmation.", badge: "Pending" },
  Failed: { icon: XCircle, color: "text-red-600", title: "Payment Failed", footer: "Payment could not be completed.", badge: "Failed" },
  Unpaid: { icon: XCircle, color: "text-red-600", title: "Unpaid", footer: "Payment is still required.", badge: "Unpaid" },
  Rejected: { icon: XCircle, color: "text-red-600", title: "Cash Payment Rejected", footer: "You may submit another cash payment request.", badge: "Rejected" },
};

interface ReceiptCardProps {
  breakdown?: { label: string; amount: number }[];
  paymentLabel?: string;
  apartmentName: string;
  landlordName?: string;
  tenantName?: string;
  date: string;
  time: string;
  method: string;
  amount: number;
  referenceNumber: string;
  status?: PaymentStatus;
  periodLabel?: string;
  /** Color behind the paper; "transparent" hangs white teeth below it instead of cutting notches. */
  backgroundColor?: string;
  /** Save and Share; the receipt's owner supplies them because they need the full payment. */
  actions?: ReactNode;
}

// The receipt is an always-white paper surface, so its content uses fixed
// light-surface colors instead of dark: variants.
function Row({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className={`text-sm font-nunito font-semibold ${highlight ? "text-primary" : "text-zinc-900"}`}>{value}</span>
    </div>
  );
}

export default function ReceiptCard({
  apartmentName,
  breakdown = [],
  paymentLabel,
  landlordName,
  tenantName,
  date,
  time,
  method,
  amount,
  referenceNumber,
  status = "Paid",
  periodLabel,
  backgroundColor = "#376BF5",
  actions,
}: ReceiptCardProps) {
  const meta = STATUS_META[status] ?? STATUS_META.Paid;
  const Icon = meta.icon;
  const floating = backgroundColor === "transparent";

  return (
    <div className="w-full max-w-[560px] mx-auto">
      <Card className={`relative rounded-t-2xl rounded-b-none border border-b-0 border-zinc-200/80 bg-white overflow-hidden ${floating ? "shadow-none" : "shadow-sm"}`}>
        <Card.Header className="flex flex-col items-center justify-center px-6 pt-8 pb-2">
          <Icon size={48} className={meta.color} />
          <h3 className={`mt-3 text-xl font-nunito font-bold ${meta.color}`}>{meta.title}</h3>
        </Card.Header>

        <Card.Content className="px-6 pb-0">
          <div className="border-t border-dashed border-zinc-300 pt-5" />

          <div className="space-y-3 py-1">
            {paymentLabel && <Row label="Payment for" value={paymentLabel} />}
            {periodLabel && <Row label="Payment Period" value={periodLabel} />}
            <Row label="Apartment" value={apartmentName} />
            {tenantName ? <Row label="Tenant" value={tenantName} /> : null}
            {landlordName ? <Row label="Landlord" value={landlordName} /> : null}
            <Row label="Date" value={date} />
            <Row label="Time" value={time} />
            <Row label="Payment Method" value={method} />
            {breakdown.map((item) => <Row key={item.label} label={item.label} value={formatPesoDisplay(item.amount)} />)}
            <Row label={status === "Paid" ? "Amount Paid" : "Payment Amount"} value={formatPesoDisplay(amount)} highlight />
            <Row label="Reference No." value={referenceNumber} />
          </div>

          <div className="border-t border-dashed border-zinc-300 mt-5 pt-4">
            <p className="text-center text-xs text-zinc-500">{meta.footer}</p>
          </div>
        </Card.Content>

        {actions ? <Card.Footer className="mt-6 mb-2 flex items-center justify-center px-6 pb-4">{actions}</Card.Footer> : null}

        {/* Mobile parity: edge overlays the card bottom (covers HeroUI bottom padding) */}
        {!floating && (
          <div className="pointer-events-none absolute bottom-0 left-0 right-0" aria-hidden>
            <ZigzagEdge cutColor={backgroundColor} depth={13} toothWidth={20} />
          </div>
        )}
      </Card>
      {/* Over a transparent dialog there is no color to cut with, so paper-colored teeth hang below. */}
      {floating && <ZigzagEdge hanging cutColor="#ffffff" depth={13} toothWidth={20} className="-mt-px" />}
    </div>
  );
}



