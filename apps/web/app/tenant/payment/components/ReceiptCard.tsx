"use client";

import { Card, Button, Separator } from "@heroui/react";
import { CheckCircle2, AlertCircle, XCircle, Download, Share2 } from "lucide-react";
import { formatPesoDisplay } from "../utils";
import type { PaymentStatus } from "../types";
import ZigzagEdge from "./ZigzagEdge";

const STATUS_META: Record<PaymentStatus, { icon: typeof CheckCircle2; color: string; title: string; footer: string; badge: string }> = {
  Paid: { icon: CheckCircle2, color: "text-green-600", title: "Payment Successful", footer: "Thank you for your payment!", badge: "Paid" },
  Pending: { icon: AlertCircle, color: "text-amber-500", title: "Payment Pending", footer: "Awaiting payment confirmation.", badge: "Pending" },
  Failed: { icon: XCircle, color: "text-red-600", title: "Payment Failed", footer: "Payment could not be completed.", badge: "Failed" },
  Unpaid: { icon: XCircle, color: "text-red-600", title: "Unpaid", footer: "Payment is still required.", badge: "Unpaid" },
};

interface ReceiptCardProps {
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
  backgroundColor?: string;
  onSave?: () => void;
  onShare?: () => void;
}

function Row({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className={`text-sm font-nunito font-semibold ${highlight ? "text-primary" : "text-zinc-900 dark:text-zinc-100"}`}>{value}</span>
    </div>
  );
}

export default function ReceiptCard({
  apartmentName,
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
  onSave,
  onShare,
}: ReceiptCardProps) {
  const meta = STATUS_META[status] ?? STATUS_META.Paid;
  const Icon = meta.icon;

  return (
    <div className="w-full max-w-[560px] mx-auto">
      <Card className="rounded-t-2xl rounded-b-none border border-zinc-200/80 bg-white shadow-sm overflow-hidden">
        <Card.Header className="flex flex-col items-center justify-center px-6 pt-8 pb-2">
          <Icon size={48} className={meta.color} />
          <h3 className={`mt-3 text-xl font-nunito font-bold ${meta.color}`}>{meta.title}</h3>
        </Card.Header>

        <Card.Content className="px-6 pb-0">
          <div className="border-t border-dashed border-zinc-300 dark:border-zinc-700 pt-5" />

          <div className="space-y-3 py-1">
            {periodLabel && <Row label="Payment Period" value={periodLabel} />}
            <Row label="Apartment" value={apartmentName} />
            {tenantName ? <Row label="Tenant" value={tenantName} /> : null}
            {landlordName ? <Row label="Landlord" value={landlordName} /> : null}
            <Row label="Date" value={date} />
            <Row label="Time" value={time} />
            <Row label="Payment Method" value={method} />
            <Row label="Amount Paid" value={formatPesoDisplay(amount)} highlight />
            <Row label="Reference No." value={referenceNumber} />
          </div>

          <div className="border-t border-dashed border-zinc-300 dark:border-zinc-700 mt-5 pt-4">
            <p className="text-center text-xs text-zinc-400">{meta.footer}</p>
          </div>
        </Card.Content>

        <Card.Footer className="mt-6 mb-2 flex items-center justify-center gap-2 px-6 pb-4">
          <Button variant="ghost" size="sm" onPress={onSave} className="gap-1.5 font-nunito text-zinc-500 hover:text-zinc-700">
            <Download size={14} />
            Save to Photos
          </Button>
          <Button variant="ghost" size="sm" onPress={onShare} className="gap-1.5 font-nunito text-zinc-500 hover:text-zinc-700">
            <Share2 size={14} />
            Share Receipt
          </Button>
        </Card.Footer>

        <ZigzagEdge cutColor={backgroundColor} depth={12} toothWidth={20} />
      </Card>
    </div>
  );
}



