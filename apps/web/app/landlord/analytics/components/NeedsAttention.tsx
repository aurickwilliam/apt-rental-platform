"use client";

import type { ComponentType } from "react";
import { Button } from "@heroui/react";
import {
  IconAlertTriangle,
  IconBellRinging,
  IconChevronRight,
  IconClipboardCheck,
  IconPigMoney,
  IconTargetArrow,
} from "@tabler/icons-react";
import {
  financeMonthLabel,
  financePlanTotals,
  type CollectionStatus,
  type FinanceData,
} from "@repo/utils";

import FinanceCard from "./FinanceCard";
import { financeMoney } from "./FinanceMoneyRow";

interface NeedsAttentionProps {
  data: FinanceData;
  month: string;
  onCollection: (status: CollectionStatus) => void;
  onExpenses: () => void;
  onBudgets: () => void;
  onReserve: () => void;
}

interface AttentionItem {
  key: string;
  title: string;
  detail: string;
  icon: ComponentType<{ size?: number; "aria-hidden"?: boolean }>;
  onPress: () => void;
}

/**
 * The report's action list, pinned above every tab. Each item is something the
 * landlord can resolve now; the count badge says how many are open. Items come
 * from the same shared figures as before — only the presentation is new.
 */
export default function NeedsAttention({
  data,
  month,
  onCollection,
  onExpenses,
  onBudgets,
  onReserve,
}: NeedsAttentionProps) {
  const { reserve, overLimit } = financePlanTotals(data.budgets);
  const active = data.months.at(-1)!;
  const items: AttentionItem[] = [];
  if (data.collections.overdue > 0) {
    items.push({
      key: "overdue",
      title: `${financeMoney(data.collections.overdue)} overdue`,
      detail: `${data.collections.overdueCount} ${data.collections.overdueCount === 1 ? "tenancy" : "tenancies"}`,
      icon: IconAlertTriangle,
      onPress: () => onCollection("overdue"),
    });
  }
  if (!active.reviewed) {
    items.push({
      key: "review",
      title: "Review expenses to see income",
      detail: financeMonthLabel(month),
      icon: IconClipboardCheck,
      onPress: onExpenses,
    });
  }
  if (overLimit) {
    items.push({
      key: "over-limit",
      title: "Review budgets over their limits",
      detail: "At least one spending limit is exceeded",
      icon: IconTargetArrow,
      onPress: onBudgets,
    });
  }
  if (reserve === 0) {
    items.push({
      key: "reserve",
      title: "Plan an emergency reserve",
      detail: "No reserve is planned for this month",
      icon: IconPigMoney,
      onPress: onReserve,
    });
  }
  return (
    <FinanceCard
      title="Needs attention"
      className="finance-attention"
      action={
        items.length ? (
          <span
            className="finance-attention-count"
            aria-label={`${items.length} open ${items.length === 1 ? "item" : "items"}`}
          >
            <IconBellRinging size={14} aria-hidden />
            {items.length}
          </span>
        ) : null
      }
    >
      {data.collections.overdue <= 0 ? (
        <p className="text-sm">No overdue balances for this rental month.</p>
      ) : null}
      {items.map(({ key, title, detail, icon: Icon, onPress }) => (
        <Button
          key={key}
          variant="ghost"
          className="finance-attention-item"
          onPress={onPress}
        >
          <Icon size={20} aria-hidden />
          <span className="min-w-0 flex-1 text-left">
            <span className="block font-semibold">{title}</span>
            <span className="block text-xs opacity-85">{detail}</span>
          </span>
          <IconChevronRight size={18} aria-hidden />
        </Button>
      ))}
    </FinanceCard>
  );
}
