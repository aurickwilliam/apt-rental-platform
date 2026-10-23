"use client";

import { Skeleton, Table } from "@heroui/react";

import PropertiesHeader from "./PropertiesHeader";

const STAT_COUNT = 4;
const ACTION_COUNT = 4;
const ROW_COUNT = 5;
const COLUMNS = ["Photo", "Name", "Location", "Type", "Price", "Rating", "Status", "Actions"];

function Sk({ className }: { className: string }) {
  return <Skeleton className={`bg-skeleton! ${className}`} />;
}

export default function PropertiesSkeleton() {
  return (
    <div className="p-4 md:p-6" aria-busy="true" aria-label="Loading properties">
      <PropertiesHeader />

      <div aria-hidden="true">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: STAT_COUNT }, (_, index) => (
            <div
              key={index}
              className={`p-4 flex flex-col gap-3 rounded-xl ${
                index === 0 ? "bg-primary" : "bg-card border border-border"
              }`}
            >
              <div className="flex items-center gap-3">
                <Sk className="size-7.5 shrink-0 rounded-md" />
                <Sk className="h-6 w-32 max-w-full rounded-lg" />
              </div>
              <Sk className="h-9 w-28 max-w-full rounded-lg" />
            </div>
          ))}
        </div>

        <section className="mt-6 rounded-3xl border border-border bg-muted/40 p-4 md:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="flex items-center gap-3 shrink-0 lg:w-64">
              <Sk className="size-11 shrink-0 rounded-xl" />
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-card-foreground">Property Actions</h3>
                <p className="text-xs text-muted-foreground">Quickly manage your properties and requests.</p>
              </div>
            </div>
            <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: ACTION_COUNT }, (_, index) => (
                <div key={index} className="flex min-w-0 items-center gap-3 rounded-2xl bg-card px-4 py-3">
                  <Sk className="size-11 shrink-0 rounded-xl" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <Sk className="h-4 w-28 max-w-full rounded-lg" />
                    <Sk className="h-3 w-32 max-w-full rounded-lg" />
                  </div>
                  <Sk className="size-4 shrink-0 rounded-md" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="flex items-center justify-between mt-6">
          <h3 className="text-base font-medium font-nunito">All Properties</h3>
        </div>
        <div className="mt-2 min-w-0">
          <Table>
            <Table.ScrollContainer className="max-w-full overflow-x-auto">
              <Table.Content aria-label="Properties loading placeholders">
                <Table.Header>
                  {COLUMNS.map((column, index) => (
                    <Table.Column
                      key={column}
                      isRowHeader={index === 1}
                      className={`font-medium text-foreground ${index === 0 ? "w-16" : index === COLUMNS.length - 1 ? "text-right" : ""}`}
                    >
                      {column}
                    </Table.Column>
                  ))}
                </Table.Header>
                <Table.Body>
                  {Array.from({ length: ROW_COUNT }, (_, index) => (
                    <Table.Row key={index} id={`loading-property-${index}`}>
                      <Table.Cell><Sk className="size-12 rounded-lg" /></Table.Cell>
                      <Table.Cell>
                        <Sk className="h-5 w-32 rounded-lg" />
                        <Sk className="h-4 w-24 rounded-lg" />
                      </Table.Cell>
                      <Table.Cell>
                        <Sk className="h-5 w-28 rounded-lg" />
                        <Sk className="h-4 w-20 rounded-lg" />
                      </Table.Cell>
                      <Table.Cell><Sk className="h-5 w-20 rounded-lg" /></Table.Cell>
                      <Table.Cell>
                        <Sk className="h-5 w-24 rounded-lg" />
                        <Sk className="h-4 w-12 rounded-lg" />
                      </Table.Cell>
                      <Table.Cell><Sk className="h-5 w-12 rounded-lg" /></Table.Cell>
                      <Table.Cell><Sk className="h-6 w-20 rounded-full" /></Table.Cell>
                      <Table.Cell><Sk className="ml-auto size-8 rounded-full" /></Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        </div>
      </div>
    </div>
  );
}
