"use client";

import { useState } from "react";
import { Button, Table } from "@heroui/react";
import {
  financePerformanceValue,
  rankFinanceProperties,
  type PropertyPerformance as Property,
  type PropertyPerformanceMetric,
} from "@repo/utils";
import FinanceCard from "./FinanceCard";
import FinanceMeter from "./FinanceMeter";
import { financeMoney } from "./FinanceMoneyRow";

interface PropertyPerformanceProps {
  properties: Property[];
  onSelect: (id: string) => void;
  onViewAll?: () => void;
  full?: boolean;
}

const COLUMNS: readonly { id: PropertyPerformanceMetric; label: string }[] = [
  { id: "collected", label: "Collected" },
  { id: "expenses", label: "Expenses" },
  { id: "net", label: "Net income" },
];

type Direction = "ascending" | "descending";

/** Ranks by the sorted metric; unreviewed net income always sorts last. */
function sortProperties(
  properties: Property[],
  metric: PropertyPerformanceMetric,
  direction: Direction,
): Property[] {
  const ranked = rankFinanceProperties(properties, metric);
  if (direction === "descending") return ranked;
  const known = ranked.filter(
    (property) => financePerformanceValue(property, metric) !== null,
  );
  const unknown = ranked.filter(
    (property) => financePerformanceValue(property, metric) === null,
  );
  return [...known.reverse(), ...unknown];
}

export default function PropertyPerformance({
  properties,
  onSelect,
  onViewAll,
  full = false,
}: PropertyPerformanceProps) {
  const [sort, setSort] = useState<{
    metric: PropertyPerformanceMetric;
    direction: Direction;
  }>({ metric: "collected", direction: "descending" });
  const ranked = sortProperties(properties, sort.metric, sort.direction);
  const maximum = Math.max(
    1,
    ...properties.map((property) => Math.abs(property.collected)),
  );
  const visible = full ? ranked : ranked.slice(0, 3);
  return (
    <FinanceCard
      title="Property performance"
      description="Select a property to focus the whole report."
    >
      {visible.length ? (
        <Table>
          <Table.ScrollContainer>
            <Table.Content
              aria-label="Property performance"
              sortDescriptor={{
                column: sort.metric,
                direction: sort.direction,
              }}
              onSortChange={({ column, direction }) =>
                setSort({
                  metric: String(column) as PropertyPerformanceMetric,
                  direction,
                })
              }
              onRowAction={(key) => onSelect(String(key))}
            >
              <Table.Header className="text-foreground! [&_th]:text-foreground!">
                <Table.Column id="name" isRowHeader>
                  Property
                </Table.Column>
                {COLUMNS.map(({ id, label }) => (
                  <Table.Column key={id} id={id} allowsSorting className="text-right">
                    {({ sortDirection }) => (
                      <Table.SortableColumnHeader className="justify-end" sortDirection={sortDirection}>
                        {label}
                      </Table.SortableColumnHeader>
                    )}
                  </Table.Column>
                ))}
              </Table.Header>
              <Table.Body>
                {visible.map((property) => {
                  const net = financePerformanceValue(property, "net");
                  return (
                    <Table.Row
                      key={property.id}
                      id={property.id}
                      textValue={`${property.name}. Filter this property.`}
                      className="cursor-pointer hover:bg-primary/10 data-[focus-visible=true]:outline-2 data-[focus-visible=true]:outline-primary"
                    >
                      <Table.Cell>
                        <p className="whitespace-normal font-nunito text-sm font-semibold">
                          {property.name}
                        </p>
                        {!property.reviewed ? (
                          <p className="whitespace-normal text-xs text-muted-foreground">
                            Expenses incomplete · net income unavailable
                          </p>
                        ) : null}
                      </Table.Cell>
                      <Table.Cell className="min-w-28 text-right text-sm tabular-nums">
                        {financeMoney(property.collected)}
                        <FinanceMeter
                          className="mt-1"
                          label={`${property.name} share of the highest collected rent`}
                          value={(Math.abs(property.collected) / maximum) * 100}
                        />
                      </Table.Cell>
                      <Table.Cell className="whitespace-nowrap text-right text-sm tabular-nums">
                        {financeMoney(property.operating + property.capital)}
                      </Table.Cell>
                      <Table.Cell
                        className={`text-right text-sm tabular-nums ${net !== null && net < 0 ? "text-destructive" : ""}`}
                      >
                        {net === null ? (
                          <span className="text-muted-foreground">
                            Not reviewed
                          </span>
                        ) : (
                          financeMoney(net)
                        )}
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      ) : (
        <p className="py-4 text-sm text-muted-foreground">
          No property performance for this month.
        </p>
      )}
      {!full && properties.length > 3 ? (
        <Button variant="tertiary" size="sm" onPress={onViewAll}>
          View all {properties.length} properties
        </Button>
      ) : null}
    </FinanceCard>
  );
}
