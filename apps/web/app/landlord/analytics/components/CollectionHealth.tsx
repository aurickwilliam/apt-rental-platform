"use client";

import { Button } from "@heroui/react";
import { IconChevronRight, IconReceipt } from "@tabler/icons-react";
import type { CollectionStatus, FinanceData } from "@repo/utils";
import FinanceCard from "./FinanceCard";
import FinanceMoneyRow, { financeMoney } from "./FinanceMoneyRow";

export default function CollectionHealth({
  data,
  onSelect,
}: {
  data: FinanceData["collections"];
  onSelect: (status: CollectionStatus) => void;
}) {
  const segments = [
    {
      id: "collected",
      label: "Collected",
      amount: data.collected,
      color: "var(--brand)",
    },
    {
      id: "pending",
      label: "Not yet due",
      amount: data.pending,
      color: "var(--finance-pending)",
    },
    {
      id: "overdue",
      label: "Overdue",
      amount: data.overdue,
      color: "var(--destructive)",
    },
  ] as const;
  return (
    <FinanceCard
      title="Collection health"
      description="Rent for the selected billing month, with payment status as of today. This differs from cash received during the month."
    >
      {data.expected > 0 ? (
        <>
          <FinanceMoneyRow label="Expected rent" amount={data.expected} />
          <div className="flex h-10 overflow-hidden rounded-lg">
            {segments
              .filter((segment) => segment.amount > 0)
              .map((segment) => (
                <Button
                  key={segment.id}
                  className="finance-segment"
                  aria-label={`${segment.label} segment: ${financeMoney(segment.amount)}`}
                  onPress={() => onSelect(segment.id)}
                  style={{
                    flex: segment.amount / data.expected,
                    background: segment.color,
                  }}
                />
              ))}
          </div>
          <div className="space-y-2">
            {segments.map((segment) => (
              <Button
                key={segment.id}
                variant="ghost"
                className="finance-choice"
                onPress={() => onSelect(segment.id)}
                aria-label={`View ${segment.label.toLowerCase()}, ${financeMoney(segment.amount)}`}
              >
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ background: segment.color }}
                  aria-hidden
                />
                <span className="flex-1 text-left">{segment.label}</span>
                <span className="font-nunito font-bold tabular-nums">
                  {financeMoney(segment.amount)}
                </span>
                <IconChevronRight size={18} aria-hidden />
              </Button>
            ))}
          </div>
          {data.overdue > 0 ? (
            <div className="space-y-2 border-t border-border pt-3">
              <h3 className="font-nunito text-sm font-semibold">
                Overdue balances by age
              </h3>
              <FinanceMoneyRow label="1–7 days" amount={data.age7} />
              <FinanceMoneyRow label="8–30 days" amount={data.age30} />
              <FinanceMoneyRow label="31+ days" amount={data.ageOlder} />
            </div>
          ) : null}
          <p className="text-xs text-muted-foreground">
            Late rent is outstanding income, not an expense. Failed payment
            attempts do not create extra rent dues.
          </p>
        </>
      ) : (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <IconReceipt
            size={32}
            className="text-muted-foreground"
            aria-hidden
          />
          <h3 className="font-nunito font-bold">
            No billable tenancies this month
          </h3>
          <p className="text-sm text-muted-foreground">
            Expected rent and payment status will appear here once a tenancy is
            billed for this month.
          </p>
        </div>
      )}
    </FinanceCard>
  );
}
