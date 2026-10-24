"use client";

import { IconAlertCircle, IconCircleCheck, IconCircleX, IconClockHour4 } from "@tabler/icons-react";
import { Card, Table } from "@heroui/react";
import { formatPesoDisplay } from "@repo/utils";
import PaymentMethodChip from "@/app/components/display/PaymentMethodChip";
import StatusChip from "@/app/components/display/StatusChip";
import { formatDateShort, formatReferenceId, paymentStatusLabel, statusVariant } from "@/app/tenant/payment/utils";
import { ledgerPeriodLabel } from "@/lib/landlord-payments-view";
import type { PaymentStatus } from "@/app/tenant/payment/types";
import type { LandlordPaymentRecord } from "@/service/landlordPaymentService";

interface PaymentsTableProps {
  payments: LandlordPaymentRecord[];
  /** Opens a payment's receipt over the list. */
  onOpen: (payment: LandlordPaymentRecord) => void;
  /** Adds the unit to each row; on when the page lists several units at once. */
  showUnit: boolean;
}

const STATUS_ICONS = {
  Paid: IconCircleCheck,
  Pending: IconClockHour4,
  Rejected: IconCircleX,
  Failed: IconCircleX,
  Unpaid: IconAlertCircle,
} satisfies Record<PaymentStatus, typeof IconCircleCheck>;

// The icon repeats the status in shape, so it never rests on color alone.
function PaymentStatusChip({ status }: { status: PaymentStatus }) {
  const Icon = STATUS_ICONS[status];
  return (
    <StatusChip size="sm" tone={statusVariant(status)} className="text-[11px]">
      <Icon size={12} aria-hidden />
      {status}
    </StatusChip>
  );
}

function periodTitle(payment: LandlordPaymentRecord): string {
  if (payment.billing_kind === "move_in") return "Move-in payment";
  return ledgerPeriodLabel(payment.due_date ?? payment.period_start ?? payment.date);
}

function dateCaption(payment: LandlordPaymentRecord): string {
  const verb = paymentStatusLabel(payment.status) === "Paid" ? "Paid" : "Recorded";
  return `${verb} ${formatDateShort(payment.date)}`;
}

// Wide screens get a table to compare months at a glance; narrow screens keep
// the compact card, since a table would scroll sideways there.
export default function PaymentsTable({ payments, showUnit, onOpen }: PaymentsTableProps) {
  return (
    <>
      <div className="hidden md:block">
        <Table>
          <Table.ScrollContainer>
            <Table.Content
              aria-label="Payments"
              onRowAction={(key) => {
                const payment = payments.find((row) => row.id === String(key));
                if (payment) onOpen(payment);
              }}
            >
              <Table.Header className="text-foreground! [&_th]:text-foreground!">
                <Table.Column id="period" isRowHeader>Period</Table.Column>
                {showUnit ? <Table.Column id="unit">Unit</Table.Column> : null}
                <Table.Column id="tenant">Tenant</Table.Column>
                <Table.Column id="method">Method</Table.Column>
                <Table.Column id="amount" className="text-right">Amount</Table.Column>
                <Table.Column id="status">Status</Table.Column>
                <Table.Column id="reference">Reference</Table.Column>
              </Table.Header>
              <Table.Body>
                {payments.map((payment) => {
                  const status = paymentStatusLabel(payment.status);
                  return (
                    <Table.Row
                      key={payment.id}
                      id={payment.id}
                      textValue={`${periodTitle(payment)}, ${formatPesoDisplay(payment.amount ?? 0)}, ${status}`}
                      className="cursor-pointer hover:bg-primary/10 data-[focus-visible=true]:outline-2 data-[focus-visible=true]:outline-primary"
                    >
                      <Table.Cell>
                        <p className="whitespace-nowrap font-nunito text-sm font-semibold">{periodTitle(payment)}</p>
                        <p className="whitespace-nowrap text-xs text-muted-foreground">{dateCaption(payment)}</p>
                      </Table.Cell>
                      {showUnit ? <Table.Cell className="text-sm">{payment.apartment_name ?? "—"}</Table.Cell> : null}
                      <Table.Cell className="text-sm">{payment.tenant_name ?? "—"}</Table.Cell>
                      <Table.Cell>
                        <PaymentMethodChip method={payment.method} />
                      </Table.Cell>
                      <Table.Cell className="text-right text-sm font-semibold tabular-nums">
                        {formatPesoDisplay(payment.amount ?? 0)}
                      </Table.Cell>
                      <Table.Cell>
                        <PaymentStatusChip status={status} />
                      </Table.Cell>
                      <Table.Cell className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatReferenceId(payment.reference_id)}
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      </div>

      <ul className="grid gap-3 md:hidden">
        {payments.map((payment) => {
          const status = paymentStatusLabel(payment.status);
          return (
            <li key={payment.id}>
              <button
                type="button"
                onClick={() => onOpen(payment)}
                aria-label={`Open receipt: ${periodTitle(payment)}, ${formatPesoDisplay(payment.amount ?? 0)}, ${status}`}
                className="block w-full cursor-pointer rounded-2xl text-left focus-visible:outline-2 focus-visible:outline-primary"
              >
                <Card className="rounded-2xl border border-border bg-card shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
                  <Card.Header className="px-4 pt-4 pb-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="min-w-0 flex-1 truncate font-nunito text-sm font-semibold text-foreground">
                        {periodTitle(payment)}
                      </p>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <PaymentMethodChip method={payment.method} />
                        <PaymentStatusChip status={status} />
                      </div>
                    </div>
                  </Card.Header>
                  <Card.Content className="px-4 pb-2">
                    <p className="font-nunito text-sm font-bold text-primary">{formatPesoDisplay(payment.amount ?? 0)}</p>
                    {showUnit && payment.apartment_name ? (
                      <p className="mt-0.5 truncate text-xs font-semibold text-muted-foreground">{payment.apartment_name}</p>
                    ) : null}
                    {payment.tenant_name ? (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{payment.tenant_name}</p>
                    ) : null}
                  </Card.Content>
                  <Card.Footer className="flex items-center justify-between gap-2 px-4 pb-4">
                    <span className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground">{dateCaption(payment)}</span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{formatReferenceId(payment.reference_id)}</span>
                  </Card.Footer>
                </Card>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
