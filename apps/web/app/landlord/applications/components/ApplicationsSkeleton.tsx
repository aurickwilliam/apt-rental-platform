"use client";

import { Skeleton, Table } from "@heroui/react";

import ApplicationsHeader from "./ApplicationsHeader";

const ROW_COUNT = 5;
const CARD_COUNT = 3;
const COLUMNS = ["Tenant", "Property", "Location", "Date", "Status"];

function Sk({ className }: { className: string }) {
  return <Skeleton className={`bg-grey-300! ${className}`} />;
}

export function ApplicationsCountSkeleton() {
  return (
    <div aria-hidden="true">
      <Sk className="h-4 w-16 rounded-lg" />
    </div>
  );
}

export function ApplicationsResultsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading applications">
      <div aria-hidden="true">
        <div className="hidden md:block">
          <Table className="bg-card">
            <Table.ScrollContainer className="max-w-full overflow-x-auto">
              <Table.Content aria-label="Applications loading placeholders" className="bg-card">
                <Table.Header className="bg-card">
                  {COLUMNS.map((column, index) => (
                    <Table.Column
                      key={column}
                      isRowHeader={index === 0}
                      className={`text-card-foreground font-medium ${index === 0 ? "w-14" : ""}`}
                    >
                      {column}
                    </Table.Column>
                  ))}
                </Table.Header>
                <Table.Body>
                  {Array.from({ length: ROW_COUNT }, (_, index) => (
                    <Table.Row key={index} id={`loading-application-${index}`}>
                      <Table.Cell>
                        <div className="flex items-center gap-2">
                          <Sk className="size-8 shrink-0 rounded-full" />
                          <div>
                            <Sk className="h-5 w-28 rounded-lg" />
                            <Sk className="h-4 w-32 rounded-lg" />
                          </div>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <Sk className="h-5 w-36 rounded-lg" />
                        <Sk className="h-4 w-24 rounded-lg" />
                      </Table.Cell>
                      <Table.Cell>
                        <Sk className="h-5 w-24 rounded-lg" />
                        <Sk className="h-4 w-32 rounded-lg" />
                      </Table.Cell>
                      <Table.Cell>
                        <Sk className="h-5 w-24 rounded-lg" />
                        <Sk className="h-4 w-28 rounded-lg" />
                      </Table.Cell>
                      <Table.Cell><Sk className="h-6 w-20 rounded-full" /></Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        </div>

        <div className="grid gap-3 md:hidden">
          {Array.from({ length: CARD_COUNT }, (_, index) => (
            <div key={index} className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-4 shadow-none">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Sk className="size-12 shrink-0 rounded-full" />
                  <div className="min-w-0 space-y-1">
                    <Sk className="h-5 w-28 max-w-full rounded-lg" />
                    <Sk className="h-5 w-32 max-w-full rounded-lg" />
                  </div>
                </div>
                <Sk className="h-6 w-20 shrink-0 rounded-full" />
              </div>
              <Sk className="h-4 w-44 max-w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ApplicationsSkeleton() {
  return (
    <div className="p-4 flex flex-col gap-4 bg-card min-h-0" aria-busy="true" aria-label="Loading applications">
      <ApplicationsHeader />
      <div aria-hidden="true" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 max-w-md">
          <Sk className="h-10 w-full rounded-xl" />
        </div>
        <Sk className="h-8 w-24 rounded-full" />
      </div>
      <ApplicationsCountSkeleton />
      <ApplicationsResultsSkeleton />
    </div>
  );
}
