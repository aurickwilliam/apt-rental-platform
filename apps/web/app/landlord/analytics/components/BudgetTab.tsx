"use client";

import { useState } from "react";
import { Button, Table } from "@heroui/react";
import {
  IconChevronDown,
  IconChevronRight,
  IconListDetails,
  IconPencil,
  IconPlus,
  IconShieldCheck,
  IconTargetArrow,
} from "@tabler/icons-react";
import {
  budgetProgress,
  financeCategoryLabel,
  groupBudgetsByCategory,
  suggestFinanceBudget,
  type BudgetCategoryGroup,
  type BudgetKind,
  type FinanceBudget,
  type FinanceCategory,
  type FinanceData,
  type FinanceProperty,
} from "@repo/utils";

import FinanceCard from "./FinanceCard";
import FinanceMeter from "./FinanceMeter";
import { financeMoney } from "./FinanceMoneyRow";

interface BudgetCallbacks {
  /** Opens the properties holding one category's plan. */
  onSelectGroup: (category: FinanceCategory, kind: BudgetKind) => void;
  /** Creates a plan, optionally preset with a goal starter's category/kind. */
  onCreate: (category?: FinanceCategory, kind?: BudgetKind) => void;
  /** Edits one saved plan, optionally with a suggestion's amount. */
  onEdit: (budget: FinanceBudget, suggestedAmount?: number) => void;
}

interface BudgetTabProps extends BudgetCallbacks {
  data: FinanceData;
  properties: FinanceProperty[];
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

const propertyNameOf = (properties: FinanceProperty[], id: string) =>
  properties.find((property) => property.id === id)?.name ?? "Property";

interface BudgetGroupsTableProps extends BudgetCallbacks {
  data: FinanceData;
  properties: FinanceProperty[];
  groups: BudgetCategoryGroup[];
  kind: BudgetKind;
  label: string;
}

/**
 * One table per plan kind, never mixing spending limits with reserves. A
 * category row expands in place to show the properties holding the plan, each
 * with its own edit action; the category page stays one click away.
 */
function BudgetGroupsTable({
  data,
  properties,
  groups,
  kind,
  label,
  onSelectGroup,
  onEdit,
}: BudgetGroupsTableProps) {
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const toggle = (key: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  const limits = kind === "expense";
  return (
    <Table>
      <Table.ScrollContainer>
        <Table.Content aria-label={label}>
          <Table.Header className="text-foreground! [&_th]:text-foreground!">
            <Table.Column id="category" isRowHeader>
              Category
            </Table.Column>
            <Table.Column id="amount" className="text-right">
              {limits ? "Limit" : "Planned / month"}
            </Table.Column>
            {limits ? (
              <Table.Column id="spent" className="text-right">
                Spent
              </Table.Column>
            ) : null}
            {limits ? <Table.Column id="used">Used</Table.Column> : null}
            {limits ? (
              <Table.Column id="remaining" className="text-right">
                Remaining
              </Table.Column>
            ) : null}
            <Table.Column id="actions" className="w-24 text-right">
              <span className="sr-only">Actions</span>
            </Table.Column>
          </Table.Header>
          <Table.Body>
            {groups.flatMap((group) => {
              const key = `${group.kind}:${group.category}`;
              const isOpen = expanded.has(key);
              const name = financeCategoryLabel(group.category);
              const progress = budgetProgress(group.amount, group.spent);
              const scope =
                group.entries.length > 1
                  ? `${group.entries.length} properties`
                  : group.entries[0]
                    ? propertyNameOf(properties, group.entries[0].apartmentId)
                    : "1 property";
              const groupRow = (
                  <Table.Row key={key} id={key}>
                    <Table.Cell>
                      <div className="flex items-center gap-2">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="ghost"
                          aria-expanded={isOpen}
                          aria-label={`${isOpen ? "Collapse" : "Expand"} ${name}, ${scope}`}
                          onPress={() => toggle(key)}
                        >
                          {isOpen ? (
                            <IconChevronDown size={16} aria-hidden />
                          ) : (
                            <IconChevronRight size={16} aria-hidden />
                          )}
                        </Button>
                        <div className="min-w-0">
                          <p className="font-nunito text-sm font-semibold">
                            {name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {scope}
                          </p>
                        </div>
                      </div>
                    </Table.Cell>
                    <Table.Cell className="whitespace-nowrap text-right text-sm tabular-nums">
                      {financeMoney(group.amount)}
                    </Table.Cell>
                    {limits ? (
                      <Table.Cell className="whitespace-nowrap text-right text-sm tabular-nums">
                        {financeMoney(group.spent)}
                      </Table.Cell>
                    ) : null}
                    {limits ? (
                      <Table.Cell className="min-w-28">
                        <FinanceMeter
                          label={`${name} spending used`}
                          value={progress.barWidth}
                          over={progress.over}
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                          {progress.percent !== null
                            ? `${progress.percent}% used`
                            : "No limit set"}
                        </p>
                      </Table.Cell>
                    ) : null}
                    {limits ? (
                      <Table.Cell
                        className={`whitespace-nowrap text-right text-sm tabular-nums ${progress.over ? "text-destructive" : ""}`}
                      >
                        {progress.over
                          ? `${financeMoney(progress.difference)} over budget`
                          : `${financeMoney(progress.difference)} remaining`}
                      </Table.Cell>
                    ) : null}
                    <Table.Cell className="text-right">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="ghost"
                        aria-label={`${name}, ${scope}. Planned ${financeMoney(group.amount)}. View properties`}
                        onPress={() => onSelectGroup(group.category, group.kind)}
                      >
                        <IconListDetails size={16} aria-hidden />
                      </Button>
                    </Table.Cell>
                  </Table.Row>
              );
              const entryRows = isOpen
                    ? group.entries.map((entry) => {
                        const budget = data.budgets.find(
                          (item) => item.id === entry.budgetId,
                        );
                        const entryProgress = budgetProgress(
                          entry.amount,
                          entry.spent,
                        );
                        const property = propertyNameOf(
                          properties,
                          entry.apartmentId,
                        );
                        return (
                          <Table.Row
                            key={entry.budgetId}
                            id={`${key}:${entry.budgetId}`}
                            className="bg-muted/40"
                          >
                            <Table.Cell className="pl-12 text-sm">
                              {property}
                            </Table.Cell>
                            <Table.Cell className="whitespace-nowrap text-right text-sm tabular-nums">
                              {financeMoney(entry.amount)}
                            </Table.Cell>
                            {limits ? (
                              <Table.Cell className="whitespace-nowrap text-right text-sm tabular-nums">
                                {financeMoney(entry.spent)}
                              </Table.Cell>
                            ) : null}
                            {limits ? (
                              <Table.Cell className="min-w-28">
                                <FinanceMeter
                                  label={`${property} spending used`}
                                  value={entryProgress.barWidth}
                                  over={entryProgress.over}
                                />
                              </Table.Cell>
                            ) : null}
                            {limits ? (
                              <Table.Cell
                                className={`whitespace-nowrap text-right text-xs tabular-nums ${entryProgress.over ? "text-destructive" : "text-muted-foreground"}`}
                              >
                                {entryProgress.over
                                  ? `${financeMoney(entryProgress.difference)} over${entryProgress.percent !== null ? ` · ${entryProgress.percent}% used` : ""}`
                                  : `${financeMoney(entryProgress.difference)} remaining`}
                              </Table.Cell>
                            ) : null}
                            <Table.Cell className="text-right">
                              {budget ? (
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="ghost"
                                  aria-label={`Edit budget: ${property}, ${name}`}
                                  onPress={() => onEdit(budget)}
                                >
                                  <IconPencil size={16} aria-hidden />
                                </Button>
                              ) : null}
                            </Table.Cell>
                          </Table.Row>
                        );
                      })
                    : [];
              return [groupRow, ...entryRows];
            })}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}

/**
 * Left column of the Budget tab: spending limits against actual spending and
 * planned reserves, each its own table. Reserves never mix with spending
 * limits, and a plan is only ever a plan — no money is moved or saved.
 */
export function BudgetMain({
  data,
  properties,
  onSelectGroup,
  onCreate,
  onEdit,
}: BudgetTabProps) {
  const groups = groupBudgetsByCategory(data.budgets);
  const spending = groups.filter((group) => group.kind === "expense");
  const reserves = groups.filter((group) => group.kind === "reserve");
  const shared = { data, properties, onSelectGroup, onCreate, onEdit };
  return (
    <>
      <FinanceCard
        title="Budget versus actual"
        description="Expand a category to see every property's limit and spending. Actual spending includes improvements in that category."
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
        ) : (
          <BudgetGroupsTable
            {...shared}
            groups={spending}
            kind="expense"
            label="Spending limits"
          />
        )}
      </FinanceCard>
      <FinanceCard
        title="Planned reserves"
        description="Allocations for later—not expenses, account balances, or money already saved. Expand a category to see the properties it covers."
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
        ) : (
          <BudgetGroupsTable
            {...shared}
            groups={reserves}
            kind="reserve"
            label="Planned reserves"
          />
        )}
      </FinanceCard>
    </>
  );
}

/** Right column of the Budget tab, under Needs attention. */
export function BudgetAside({
  data,
  properties,
  onCreate,
  onEdit,
}: Pick<BudgetTabProps, "data" | "properties" | "onCreate" | "onEdit">) {
  const suggestions = data.budgets
    .map((budget) => ({ budget, suggestion: suggestFinanceBudget(budget) }))
    .filter((item) => item.suggestion !== null);
  return (
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
            {propertyNameOf(properties, budget.apartment_id)} · Based on your
            entries
          </p>
          <p className="font-nunito text-lg font-bold text-brand">
            {financeMoney(suggestion!.amount)} / month
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
          <p className="text-sm text-muted-foreground">{starter.description}</p>
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
  );
}
