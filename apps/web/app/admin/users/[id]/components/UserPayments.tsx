import { IconCreditCard } from "@tabler/icons-react";
import { Card, Chip, Separator } from "@heroui/react";
import { formatPesoDisplay } from "@repo/utils";
import { submittedFormatter } from "../../../verification/lib/verification-display";
import { DetailEmptyState, MetricItem } from "./UserDetailPrimitives";

export interface UserPayment {
  id: string;
  amount: number | null;
  status: string;
  method: string;
  date: string;
  apartment_name: string;
}

interface UserPaymentsProps {
  payments: UserPayment[];
  paidTotal: number;
  transactionCount: number;
}

function paymentColor(status: string): "success" | "warning" | "danger" | "default" {
  if (status === "paid") return "success";
  if (status === "pending") return "warning";
  if (status === "failed" || status === "expired") return "danger";
  return "default";
}

export default function UserPayments({
  payments,
  paidTotal,
  transactionCount,
}: UserPaymentsProps) {
  const latest = payments[0] ?? null;
  return (
    <Card className="rounded-3xl border border-border bg-card p-4 shadow-none sm:p-5">
      <Card.Content className="p-0">
      <h2 className="flex items-center gap-2 font-nunito text-lg font-bold text-primary">
        <IconCreditCard size={20} className="shrink-0 text-primary" aria-hidden="true" />
        Payments
      </h2>
      <div className="mt-3 grid grid-cols-3 gap-4">
        <MetricItem value={formatPesoDisplay(paidTotal)} label="Collected" />
        <MetricItem value={String(transactionCount)} label="Transactions" />
        <MetricItem
          value={
            latest ? submittedFormatter.format(new Date(latest.date)) : "—"
          }
          label="Last payment"
        />
      </div>
      {latest ? (
        <>
          <Separator className="my-3" />
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="min-w-0">
            <span className="font-nunito font-semibold text-primary">
              {formatPesoDisplay(latest.amount ?? 0)}
            </span>{" "}
            <span className="text-muted-foreground">
              · {latest.method} · {latest.apartment_name}
            </span>
          </span>
          <Chip
            size="sm"
            variant="soft"
            color={paymentColor(latest.status)}
            className="shrink-0 capitalize"
          >
            {latest.status}
          </Chip>
          </div>
        </>
      ) : (
        <DetailEmptyState>No payment history</DetailEmptyState>
      )}
      </Card.Content>
    </Card>
  );
}
