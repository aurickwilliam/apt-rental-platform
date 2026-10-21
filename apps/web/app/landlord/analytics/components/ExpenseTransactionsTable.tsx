"use client";

import { Button, Chip, Table } from "@heroui/react";
import { IconDownload, IconReceipt2 } from "@tabler/icons-react";
import {
  budgetCategoryOptions,
  financeCategoryLabel,
  financeMonthLabel,
  type ExpenseRecord,
  type FinanceCategory,
  type FinanceProperty,
  type FinanceScope,
} from "@repo/utils";

import SettingsSelect from "@/app/components/settings/SettingsSelect";
import { Skeleton } from "@/components/ui/skeleton";
import type { FinancePagesResult } from "@/hooks/use-landlord-finances";

import FinanceCard from "./FinanceCard";
import { financeMoney } from "./FinanceMoneyRow";

const ALL_CATEGORIES = "all";
const CATEGORY_OPTIONS = [
  { value: ALL_CATEGORIES, label: "All categories" },
  ...budgetCategoryOptions("expense").map((item) => ({
    value: item.id,
    label: item.label,
  })),
];

interface ExpenseTransactionsTableProps {
  scope: FinanceScope;
  properties: FinanceProperty[];
  expenses: FinancePagesResult<ExpenseRecord>;
  category: FinanceCategory | null;
  onCategoryChange: (category: FinanceCategory | null) => void;
  onEdit: (expense: ExpenseRecord) => void;
  onExport: () => void;
}

/**
 * The month's expenses for the applied scope as a table. Rows page in with the
 * same keyset controller as the category drill-down; selecting a row opens the
 * expense drawer. Export covers exactly the rows that are loaded.
 */
export default function ExpenseTransactionsTable({
  scope,
  properties,
  expenses,
  category,
  onCategoryChange,
  onEdit,
  onExport,
}: ExpenseTransactionsTableProps) {
  const { rows } = expenses;
  const property = scope.apartmentId
    ? properties.find((item) => item.id === scope.apartmentId)
    : null;
  const propertyName = (id: string) =>
    properties.find((item) => item.id === id)?.name ?? "Property";
  return (
    <FinanceCard
      title="Transactions"
      description={`Expenses paid in ${financeMonthLabel(scope.month)}${property ? ` for ${property.name}` : ""}. Select a row to edit it.`}
      action={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <SettingsSelect
            label="Category"
            className="w-48"
            value={category ?? ALL_CATEGORIES}
            options={CATEGORY_OPTIONS}
            onChange={(value) =>
              onCategoryChange(
                value === ALL_CATEGORIES ? null : (value as FinanceCategory),
              )
            }
          />
          <Button
            variant="outline"
            size="sm"
            isDisabled={!rows.length}
            onPress={onExport}
          >
            <IconDownload size={16} aria-hidden />
            Export CSV
          </Button>
        </div>
      }
    >
      <div aria-live="polite" className="space-y-3">
        {rows.length ? (
          <Table>
            <Table.ScrollContainer>
              <Table.Content
                aria-label="Expense transactions"
                onRowAction={(key) => {
                  const expense = rows.find((row) => row.id === String(key));
                  if (expense) onEdit(expense);
                }}
              >
                <Table.Header className="text-foreground! [&_th]:text-foreground!">
                  <Table.Column id="date">Paid</Table.Column>
                  <Table.Column id="description" isRowHeader>
                    Description
                  </Table.Column>
                  <Table.Column id="category">Category</Table.Column>
                  <Table.Column id="amount" className="text-right">
                    Amount
                  </Table.Column>
                </Table.Header>
                <Table.Body>
                  {rows.map((expense) => (
                    <Table.Row
                      key={expense.id}
                      id={expense.id}
                      textValue={`Edit ${expense.description}, ${financeMoney(expense.amount)}, paid ${expense.spent_on}`}
                      className="cursor-pointer hover:bg-primary/10 data-[focus-visible=true]:outline-2 data-[focus-visible=true]:outline-primary"
                    >
                      <Table.Cell className="whitespace-nowrap text-sm tabular-nums">
                        {expense.spent_on}
                      </Table.Cell>
                      <Table.Cell>
                        <p className="whitespace-normal font-nunito text-sm font-semibold">
                          {expense.description}
                        </p>
                        <p className="whitespace-normal text-xs text-muted-foreground">
                          {scope.apartmentId
                            ? ""
                            : `${propertyName(expense.apartment_id)} · `}
                          {expense.treatment === "capital"
                            ? "Improvement / replacement"
                            : "Operating"}
                        </p>
                      </Table.Cell>
                      <Table.Cell>
                        <Chip size="sm">
                          {financeCategoryLabel(expense.category)}
                        </Chip>
                      </Table.Cell>
                      <Table.Cell className="text-right text-sm font-semibold tabular-nums">
                        {financeMoney(expense.amount)}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        ) : null}
        {expenses.loading && !rows.length ? (
          <div className="space-y-2" aria-label="Loading expenses">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : null}
        {!rows.length && !expenses.loading && !expenses.error ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <IconReceipt2
              size={32}
              className="text-muted-foreground"
              aria-hidden
            />
            <h3 className="font-nunito font-bold">
              {category ? "No expenses in this category" : "No expenses recorded"}
            </h3>
            <p className="text-sm text-muted-foreground">
              Nothing recorded in {financeMonthLabel(scope.month)}
              {property ? ` for ${property.name}` : ""}.
            </p>
          </div>
        ) : null}
        {expenses.error ? (
          <div className="space-y-2 py-4 text-center" role="alert">
            <p className="text-sm">{expenses.error}</p>
            <Button
              size="sm"
              variant="secondary"
              onPress={() => void expenses.refresh()}
            >
              Retry
            </Button>
          </div>
        ) : null}
        {expenses.pageError ? (
          <p role="alert" className="text-sm">
            {expenses.pageError} Your loaded rows are still here. Try Load more
            again.
          </p>
        ) : null}
        {expenses.hasMore ? (
          <div className="flex justify-center pt-1">
            <Button
              variant="secondary"
              isDisabled={expenses.loadingMore}
              onPress={() => void expenses.loadMore()}
            >
              {expenses.loadingMore ? "Loading…" : "Load more expenses"}
            </Button>
          </div>
        ) : null}
      </div>
    </FinanceCard>
  );
}
