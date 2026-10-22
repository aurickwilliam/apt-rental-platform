"use client";

import { Skeleton, Table } from "@heroui/react";

import MaintenanceHeader from "./MaintenanceHeader";
import MaintenanceSummary from "./MaintenanceSummary";

const ROW_COUNT = 5;
const CARD_COUNT = 3;
const COLUMNS = ["Issue", "Property", "Location", "Tenant", "Reported", "Urgency", "Status", "Actions"];

function Sk({ className }: { className: string }) {
  return <Skeleton className={`bg-grey-300! ${className}`} />;
}

export function MaintenanceCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-4 shadow-none">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Sk className="size-10 shrink-0 rounded-xl" />
          <div className="min-w-0 space-y-1">
            <Sk className="h-5 w-32 max-w-full rounded-lg" />
            <Sk className="h-5 w-28 max-w-full rounded-lg" />
          </div>
        </div>
        <Sk className="h-6 w-20 shrink-0 rounded-full" />
      </div>
      <div className="flex items-center gap-3"><Sk className="size-12 shrink-0 rounded-lg" /><Sk className="h-10 w-40 rounded-lg" /></div>
      <div className="flex items-center gap-2"><Sk className="size-8 shrink-0 rounded-full" /><Sk className="h-4 w-28 rounded-lg" /></div>
      <div className="flex items-center justify-between gap-3">
          <Sk className="h-4 w-24 min-w-0 rounded-lg" />
        <div className="flex shrink-0 items-center gap-2">
          <Sk className="h-6 w-16 rounded-full" />
          <Sk className="h-4 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function MaintenanceTableSkeleton() {
  return (
    <Table className="maintenance-list-table">
      <Table.ScrollContainer className="max-w-full overflow-x-auto">
        <Table.Content aria-label="Maintenance loading placeholders" className="bg-card">
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
              <Table.Row key={index} id={`loading-maintenance-${index}`}>
                <Table.Cell>
                  <div className="flex items-center gap-2">
                    <Sk className="size-10 shrink-0 rounded-xl" />
                    <div><Sk className="h-5 w-36 rounded-lg" /><Sk className="h-4 w-32 rounded-lg" /></div>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex items-center gap-3"><Sk className="size-12 shrink-0 rounded-lg" /><div><Sk className="h-5 w-32 rounded-lg" /><Sk className="h-4 w-24 rounded-lg" /></div></div>
                </Table.Cell>
                <Table.Cell><Sk className="h-5 w-24 rounded-lg" /><Sk className="h-4 w-32 rounded-lg" /></Table.Cell>
                <Table.Cell>
                  <div className="flex items-center gap-2">
                    <Sk className="size-10 shrink-0 rounded-full" />
                    <div><Sk className="h-5 w-28 rounded-lg" /><Sk className="h-4 w-32 rounded-lg" /></div>
                  </div>
                </Table.Cell>
                <Table.Cell><Sk className="h-5 w-24 rounded-lg" /><Sk className="h-4 w-20 rounded-lg" /></Table.Cell>
                <Table.Cell><Sk className="h-6 w-16 rounded-full" /></Table.Cell>
                <Table.Cell><Sk className="h-6 w-20 rounded-full" /></Table.Cell>
                <Table.Cell><Sk className="size-8 rounded-full" /></Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}

export function MaintenanceCountSkeleton() {
  return (
    <div aria-hidden="true">
      <Sk className="h-4 w-16 rounded-lg" />
    </div>
  );
}

export function MaintenanceResultsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading maintenance requests">
      <div aria-hidden="true">
        <div className="hidden md:block">
          <MaintenanceTableSkeleton />
        </div>
        <div className="grid gap-3 md:hidden">
          {Array.from({ length: CARD_COUNT }, (_, index) => <MaintenanceCardSkeleton key={index} />)}
        </div>
      </div>
    </div>
  );
}

export default function MaintenanceSkeleton() {
  return (
    <div className="landlord-maintenance-page w-full min-w-0 p-4 md:p-6 flex flex-col gap-6 bg-card min-h-0" aria-busy="true" aria-label="Loading maintenance requests">
      <MaintenanceHeader />
      <MaintenanceSummary loading />
      <div aria-hidden="true" className="grid grid-cols-1 items-center gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(240px,2fr)_repeat(4,minmax(0,1fr))_auto]">
        <Sk className="h-11 w-full rounded-xl sm:col-span-2 xl:col-span-1" />
        {Array.from({ length: 4 }, (_, index) => <Sk key={index} className="h-11 w-full rounded-xl" />)}
        <Sk className="h-11 w-28 rounded-full" />
      </div>
      <div className="min-w-0 rounded-2xl border border-border bg-card p-4 md:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><MaintenanceCountSkeleton /><div aria-hidden="true"><Sk className="h-11 w-52 rounded-xl" /></div></div>
        <MaintenanceResultsSkeleton />
      </div>
    </div>
  );
}
