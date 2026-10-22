"use client";

import { Button } from "@heroui/react";
import { IconPlus } from "@tabler/icons-react";
import {
  financeCategoryLabel,
  groupBudgetsByCategory,
  type BudgetKind,
  type FinanceCategory,
  type FinanceData,
  type FinanceProperty,
} from "@repo/utils";

import BudgetProgressRow from "./BudgetProgressRow";
import FinanceCard from "./FinanceCard";
import { financeMoney } from "./FinanceMoneyRow";

interface BudgetCallbacks {
  /** Opens the properties holding one category's plan. */
  onSelectGroup: (category: FinanceCategory, kind: BudgetKind) => void;
  /** Creates a plan, optionally preset with a category and plan kind. */
  onCreate: (category?: FinanceCategory, kind?: BudgetKind) => void;
}

interface BudgetTabProps extends BudgetCallbacks {
  data: FinanceData;
  properties: FinanceProperty[];
}

const propertyNameOf = (properties: FinanceProperty[], id: string) =>
  properties.find((property) => property.id === id)?.name ?? "Property";

/**
 * Right column of the Budget tab: spending limits against actual spending as
 * one tinted card per category, like mobile. A card opens the properties
 * holding that category's plan; reserves are never mixed in.
 */
export function BudgetActual({
  data,
  properties,
  onSelectGroup,
  onCreate,
}: BudgetTabProps) {
  const spending = groupBudgetsByCategory(data.budgets).filter(
    (group) => group.kind === "expense",
  );
  return (
    <FinanceCard
      title="Budget versus actual"
      description="Select a category to compare each property's budget and spending, including improvements."
      action={
        <Button
          variant="tertiary"
          size="sm"
          onPress={() => onCreate(undefined, "expense")}
        >
          <IconPlus size={16} aria-hidden />
          Add spending limit
        </Button>
      }
      contentClassName="space-y-3"
    >
      {spending.length === 0 ? (
        <div className="space-y-1 py-2">
          <h3 className="font-nunito font-bold">No spending limits yet</h3>
          <p className="text-sm text-muted-foreground">
            Set spending limits for repairs, utilities and other property
            costs.
          </p>
        </div>
      ) : null}
      {spending.map((group) => (
        <BudgetProgressRow
          key={`${group.kind}:${group.category}`}
          category={group.category}
          title={financeCategoryLabel(group.category)}
          caption={
            group.entries.length > 1
              ? `${group.entries.length} properties`
              : group.entries[0]
                ? propertyNameOf(properties, group.entries[0].apartmentId)
                : "1 property"
          }
          amount={group.amount}
          spent={group.spent}
          action="View properties"
          onPress={() => onSelectGroup(group.category, group.kind)}
        />
      ))}
    </FinanceCard>
  );
}

/**
 * Left column of the Budget tab: planned reserves as one tinted card per
 * category. Reserves are plans, never expenses, and no money is moved or
 * saved; a card opens the properties holding that category's plan.
 */
export function BudgetMain({
  data,
  onSelectGroup,
  onCreate,
}: Pick<BudgetTabProps, "data" | "onSelectGroup" | "onCreate">) {
  const reserves = groupBudgetsByCategory(data.budgets).filter(
    (group) => group.kind === "reserve",
  );
  return (
    <FinanceCard
      title="Planned reserves"
      description="Allocations for later—not expenses, account balances, or money already saved. Select a category to see the properties it covers."
      action={
        <Button
          variant="tertiary"
          size="sm"
          onPress={() => onCreate("emergency", "reserve")}
        >
          <IconPlus size={16} aria-hidden />
          Add reserve
        </Button>
      }
      contentClassName="space-y-3"
    >
      {reserves.length === 0 ? (
        <div className="space-y-1 py-2">
          <h3 className="font-nunito font-bold">No reserve goals yet</h3>
          <p className="text-sm text-muted-foreground">
            Plan a buffer for unexpected repairs, late payments, vacancies or
            replacements.
          </p>
        </div>
      ) : null}
      {reserves.map((group) => {
        const name = financeCategoryLabel(group.category);
        const count = `${group.entries.length} ${group.entries.length === 1 ? "property" : "properties"}`;
        return (
          <Button
            key={`${group.kind}:${group.category}`}
            variant="ghost"
            className="finance-category-row items-stretch text-left"
            data-finance-category={group.category}
            aria-label={`${name}. For ${count} this month. Planned ${financeMoney(group.amount)}. View properties`}
            onPress={() => onSelectGroup(group.category, group.kind)}
          >
            <div className="w-full space-y-1 text-left">
              <div className="flex items-baseline justify-between gap-3">
                <p className="min-w-0 flex-1 font-nunito text-base font-semibold">
                  {name}
                </p>
                <p className="shrink-0 font-nunito text-base font-bold tabular-nums">
                  {financeMoney(group.amount)}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                For {count} this month
              </p>
            </div>
          </Button>
        );
      })}
    </FinanceCard>
  );
}
