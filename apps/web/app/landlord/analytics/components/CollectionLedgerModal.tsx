"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button, Spinner, Table, Tabs } from "@heroui/react";
import {
  financeMonthLabel,
  rentAgeBucket,
  type CollectionStatus,
  type FinanceScope,
  type RentLedgerRow,
} from "@repo/utils";
import { useFinanceCollections } from "@/hooks/use-landlord-finances";
import FinanceModal from "./FinanceModal";
import { financeMoney } from "./FinanceMoneyRow";

interface CollectionLedgerModalProps {
  ownerId: string;
  scope: FinanceScope;
  initialStatus: CollectionStatus;
  onClose: () => void;
}

function LedgerRows({
  rows,
  status,
}: {
  rows: readonly RentLedgerRow[];
  status: CollectionStatus;
}) {
  const amount = (row: RentLedgerRow) =>
    financeMoney(status === "collected" ? row.collected : row.outstanding);
  const due = (row: RentLedgerRow) =>
    `Due ${row.due_date}${status === "overdue" ? ` · ${rentAgeBucket(row.days_late)} late` : ""}`;
  const propertyLink = (row: RentLedgerRow) => (
    <Link
      className="font-semibold text-brand underline underline-offset-2"
      href={`/landlord/properties/${row.apartment_id}`}
    >
      Open property & tenancy
      <span className="sr-only">: {row.apartment_name}</span>
    </Link>
  );
  return (
    <>
      <div className="hidden md:block">
        <Table>
          <Table.ScrollContainer>
            <Table.Content aria-label="Rent collections">
              <Table.Header>
                <Table.Column isRowHeader>Property</Table.Column>
                <Table.Column>Tenant</Table.Column>
                <Table.Column>
                  {status === "collected" ? "Collected" : "Outstanding"}
                </Table.Column>
                <Table.Column>Due / age</Table.Column>
                <Table.Column>Action</Table.Column>
              </Table.Header>
              <Table.Body>
                {rows.map((row) => (
                  <Table.Row key={row.id} id={row.id}>
                    <Table.Cell>{row.apartment_name}</Table.Cell>
                    <Table.Cell>{row.tenant_name}</Table.Cell>
                    <Table.Cell className="whitespace-nowrap font-nunito font-bold tabular-nums">
                      {amount(row)}
                    </Table.Cell>
                    <Table.Cell>{due(row)}</Table.Cell>
                    <Table.Cell>{propertyLink(row)}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      </div>
      <div className="space-y-3 md:hidden">
        {rows.map((row) => (
          <article
            key={row.id}
            className="space-y-2 rounded-xl border border-border p-3"
          >
            <h3 className="font-nunito font-bold">{row.apartment_name}</h3>
            <p className="text-sm">{row.tenant_name}</p>
            <p className="font-nunito text-lg font-bold text-brand">
              {amount(row)}
            </p>
            <p className="text-xs text-muted-foreground">{due(row)}</p>
            <p className="text-sm">{propertyLink(row)}</p>
          </article>
        ))}
      </div>
    </>
  );
}

export default function CollectionLedgerModal({
  ownerId,
  scope,
  initialStatus,
  onClose,
}: CollectionLedgerModalProps) {
  const [status, setStatus] = useState(initialStatus);
  const [pending, startPending] = useTransition();
  const query = useFinanceCollections(ownerId, scope, status, true);
  const content = (
    <div className="space-y-4 pt-4">
      {query.loading ? (
        <div className="py-8" role="status">
          <Spinner size="sm" /> Loading rent collections…
        </div>
      ) : (
        <>
          {query.error ? (
            <div role="alert" className="space-y-2 text-sm">
              <p>{query.error}</p>
              <Button
                size="sm"
                variant="secondary"
                isDisabled={pending}
                onPress={() =>
                  startPending(async () => {
                    await query.refresh();
                  })
                }
              >
                Retry collections
              </Button>
            </div>
          ) : null}
          {query.rows.length ? (
            <LedgerRows rows={query.rows} status={status} />
          ) : !query.error ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No rent in this category.
            </p>
          ) : null}
          {query.pageError ? (
            <p role="alert" className="text-sm">
              {query.pageError} Your loaded rows are still here. Try Load more
              again.
            </p>
          ) : null}
        </>
      )}
    </div>
  );
  return (
    <FinanceModal
      title="Rent collections"
      description={`${financeMonthLabel(scope.month)} rent · status today. Rental-period balances, not cash received this month.`}
      onClose={onClose}
      wide
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          {query.hasMore ? (
            <Button
              variant="secondary"
              isPending={pending}
              isDisabled={pending || query.loading}
              onPress={() =>
                startPending(async () => {
                  await query.loadMore();
                })
              }
            >
              {pending ? "Loading…" : "Load more"}
            </Button>
          ) : null}
          <Button
            variant="tertiary"
            isDisabled={pending || query.loading}
            onPress={() =>
              startPending(async () => {
                await query.refresh();
              })
            }
          >
            Refresh collections
          </Button>
          <Button onPress={onClose}>Close</Button>
        </div>
      }
    >
      <Tabs
        selectedKey={status}
        onSelectionChange={(key) => setStatus(String(key) as CollectionStatus)}
      >
        <Tabs.ListContainer>
          <Tabs.List aria-label="Collection status">
            {(
              [
                ["collected", "Collected"],
                ["pending", "Not due"],
                ["overdue", "Overdue"],
              ] as const
            ).map(([key, label]) => (
              <Tabs.Tab key={key} id={key}>
                <span>{label}</span>
                <Tabs.Indicator />
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.ListContainer>
        <Tabs.Panel id={status}>{content}</Tabs.Panel>
      </Tabs>
    </FinanceModal>
  );
}
