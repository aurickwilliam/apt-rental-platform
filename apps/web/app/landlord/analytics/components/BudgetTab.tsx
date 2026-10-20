"use client";

import { Button } from "@heroui/react";
import { IconPlus, IconShieldCheck, IconTargetArrow } from "@tabler/icons-react";
import {
  financeCategoryLabel,
  formatPesoDisplay,
  groupBudgetsByCategory,
  suggestFinanceBudget,
  type BudgetKind,
  type FinanceBudget,
  type FinanceCategory,
  type FinanceData,
  type FinanceProperty,
} from "@repo/utils";

import BudgetProgressRow from "./BudgetProgressRow";
import FinanceCard from "./FinanceCard";
import FinanceMoneyRow from "./FinanceMoneyRow";

interface BudgetTabProps {
  data: FinanceData;
  properties: FinanceProperty[];
  /** Opens the properties holding one category's plan. */
  onSelectGroup: (category: FinanceCategory, kind: BudgetKind) => void;
  /** Creates a plan, optionally preset with a goal starter's category/kind. */
  onCreate: (category?: FinanceCategory, kind?: BudgetKind) => void;
  /** Edits one saved plan, optionally with a suggestion's amount. */
  onEdit: (budget: FinanceBudget, suggestedAmount?: number) => void;
}

/** The four goal starters, matching mobile's suggested starting points. */
const GOAL_STARTERS: readonly {
  category: FinanceCategory;
  kind: BudgetKind;
  title: string;
  description: string;
}[] = [
  {
    category: "insurance",
    kind: "reserve",
    title: "Insurance & property tax",
    description:
      "Spread your known annual bill over 12 months. Enter the bill to calculate a monthly allocation.",
  },
  {
    category: "furniture",
    kind: "reserve",
    title: "Furniture & appliances",
    description:
      "Enter the replacement amount still needed and the number of months until purchase.",
  },
  {
    category: "vacancy",
    kind: "reserve",
    title: "Vacancy & late payments",
    description:
      "Choose a buffer target based on essential property costs. Unpaid rent itself is not an expense.",
  },
  {
    category: "turnover",
    kind: "reserve",
    title: "Next tenant turnover",
    description:
      "Plan for cleaning, repainting and refurbishment before the next move-in.",
  },
];

/**
 * Web mirror of mobile's Budget tab: spending limits against actual
 * spending, planned reserves, and transparent suggestions with goal starters.
 * Reserves never mix with spending limits, and a plan is only ever a plan —
 * no money is moved or saved.
 */
export default function BudgetTab({
  data,
  properties,
  onSelectGroup,
  onCreate,
  onEdit,
}: BudgetTabProps) {
  const groups = groupBudgetsByCategory(data.budgets);
  const spending = groups.filter((group) => group.kind === "expense");
  const reserves = groups.filter((group) => group.kind === "reserve");
  const propertyName = (apartmentId: string) =>
    properties.find((property) => property.id === apartmentId)?.name ??
    "Property";
  const scopeLabel = (group: (typeof groups)[number]) => {
    if (group.entries.length > 1) return `${group.entries.length} properties`;
    const [entry] = group.entries;
    return entry ? propertyName(entry.apartmentId) : "1 property";
  };
  const suggestions = data.budgets
    .map((budget) => ({ budget, suggestion: suggestFinanceBudget(budget) }))
    .filter((item) => item.suggestion !== null);
  return (
    <div className="space-y-4">
      <FinanceCard
        title="Budget versus actual"
        description="Open a category to see every property's limit and spending. Actual spending includes improvements in that category."
        action={
          <Button variant="tertiary" size="sm" onPress={() => onCreate()}>
            <IconPlus size={16} aria-hidden />
            Add
          </Button>
        }
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
            title={financeCategoryLabel(group.category)}
            caption={scopeLabel(group)}
            amount={group.amount}
            spent={group.spent}
            action="View properties"
            onPress={() => onSelectGroup(group.category, group.kind)}
          />
        ))}
      </FinanceCard>
      <FinanceCard
        title="Planned reserves"
        description="Allocations for later—not expenses, account balances, or money already saved. Open a category to see the properties it covers."
        action={
          <Button
            variant="tertiary"
            size="sm"
            onPress={() => onCreate("emergency", "reserve")}
          >
            <IconPlus size={16} aria-hidden />
            Add
          </Button>
        }
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
        {reserves.map((group) => (
          <Button
            key={`${group.kind}:${group.category}`}
            variant="ghost"
            className="h-auto w-full items-stretch whitespace-normal py-2 text-left"
            aria-label={`${financeCategoryLabel(group.category)}, ${scopeLabel(group)}. Planned ${formatPesoDisplay(group.amount)} this month. View properties`}
            onPress={() => onSelectGroup(group.category, group.kind)}
          >
            <div className="w-full space-y-1 text-left">
              <FinanceMoneyRow
                label={financeCategoryLabel(group.category)}
                amount={group.amount}
              />
              <p className="text-xs text-muted-foreground">
                {scopeLabel(group)} · planned this month
              </p>
            </div>
          </Button>
        ))}
      </FinanceCard>
      <FinanceCard
        title="Budget suggestions"
        description="Transparent starting points. Use your bills and goals, not assumed market costs."
      >
        {suggestions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Set a goal on a plan and its monthly suggestion appears here.
          </p>
        ) : null}
        {suggestions.map(({ budget, suggestion }) => (
          <div key={budget.id} className="space-y-2 border-b border-border pb-3">
            <p className="font-nunito text-sm font-semibold">
              {suggestion!.title}
            </p>
            <p className="text-xs text-muted-foreground">
              {propertyName(budget.apartment_id)} · Based on your entries
            </p>
            <p className="font-nunito text-lg font-bold text-brand">
              {formatPesoDisplay(suggestion!.amount)} / month
            </p>
            <p className="text-xs text-muted-foreground">{suggestion!.basis}</p>
            <Button
              variant="secondary"
              size="sm"
              onPress={() => onEdit(budget, suggestion!.amount)}
            >
              Review suggestion
            </Button>
          </div>
        ))}
        {GOAL_STARTERS.map((starter) => (
          <div key={starter.category} className="space-y-2">
            <p className="font-nunito text-sm font-semibold">{starter.title}</p>
            <p className="text-sm text-muted-foreground">
              {starter.description}
            </p>
            <Button
              variant="tertiary"
              size="sm"
              onPress={() => onCreate(starter.category, starter.kind)}
            >
              <IconTargetArrow size={16} aria-hidden />
              Set a goal
            </Button>
          </div>
        ))}
        <p className="text-xs text-muted-foreground">
          <IconShieldCheck size={14} aria-hidden className="mr-1 inline" />
          Suggestions never save on their own — review the plan first.
        </p>
      </FinanceCard>
    </div>
  );
}
