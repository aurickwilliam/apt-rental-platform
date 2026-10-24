"use client";

import { Suspense, useMemo, useState } from "react";
import { Badge, Button, Card, ComboBox, Input, ListBox, Tabs } from "@heroui/react";
import { IconReceipt as Receipt, IconRefresh } from "@tabler/icons-react";
import SettingsSelect from "@/app/components/settings/SettingsSelect";
import { paymentStatusLabel } from "@/app/tenant/payment/utils";
import { useLandlordApartments, useLandlordPayments } from "@/hooks/use-landlord-payments";
import {
  ALL_APARTMENTS,
  ALL_YEARS,
  availableLedgerYears,
  countByTab,
  filterByYear,
  isAwaitingCashConfirmation,
  matchesTab,
  sortLedger,
  summarizeLedger,
  type LedgerRow,
  type LedgerSort,
  type LedgerTab,
} from "@/lib/landlord-payments-view";
import type { LandlordPaymentRecord } from "@/service/landlordPaymentService";
import NeedsAttentionCard from "./components/NeedsAttentionCard";
import PaymentsHeader from "./components/PaymentsHeader";
import PaymentsSkeleton, { NeedsAttentionSkeleton, PaymentsBodySkeleton } from "./components/PaymentsSkeleton";
import PaymentsSummary from "./components/PaymentsSummary";
import PaymentsTable from "./components/PaymentsTable";

type PaymentLedgerRow = LedgerRow & { payment: LandlordPaymentRecord };

const TABS: { id: LedgerTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "paid", label: "Paid" },
  { id: "pending", label: "Pending" },
  { id: "declined", label: "Declined" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
] as const;

function toLedgerRow(payment: LandlordPaymentRecord): PaymentLedgerRow {
  return {
    id: payment.id,
    status: paymentStatusLabel(payment.status),
    method: payment.method,
    amount: payment.amount,
    date: payment.date,
    payment,
  };
}

function PaymentsContent() {
  const [tab, setTab] = useState<LedgerTab>("all");
  const [year, setYear] = useState<string>(ALL_YEARS);
  const [sort, setSort] = useState<LedgerSort>("newest");

  const unitsQuery = useLandlordApartments();
  const [apartmentId, setApartmentId] = useState<string>(ALL_APARTMENTS);
  // A unit that is no longer in the list falls back to every unit.
  const activeApartmentId = unitsQuery.apartments.some((unit) => unit.id === apartmentId) ? apartmentId : ALL_APARTMENTS;
  const showUnit = activeApartmentId === ALL_APARTMENTS;
  const unitOptions = [{ id: ALL_APARTMENTS, name: "All apartments" }, ...unitsQuery.apartments];
  const paymentsQuery = useLandlordPayments(activeApartmentId);

  const ledger = useMemo(() => paymentsQuery.payments.map(toLedgerRow), [paymentsQuery.payments]);
  const years = useMemo(() => availableLedgerYears(ledger), [ledger]);
  // A year that no longer exists for the selected unit falls back to every year.
  const activeYear = year === ALL_YEARS || years.includes(year) ? year : ALL_YEARS;

  const inYear = useMemo(() => filterByYear(ledger, activeYear), [ledger, activeYear]);
  const summary = useMemo(() => summarizeLedger(inYear), [inYear]);
  const tabCounts = useMemo(() => countByTab(inYear), [inYear]);
  const rows = useMemo(
    () => sortLedger(inYear.filter((row) => matchesTab(row, tab)), sort),
    [inYear, tab, sort],
  );
  // Action list: every cash payment waiting on the landlord, whatever the filters say.
  const awaitingCash = useMemo(
    () => sortLedger(ledger.filter(isAwaitingCashConfirmation), "oldest").map((row) => row.payment),
    [ledger],
  );

  if (unitsQuery.error || paymentsQuery.error) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <PaymentsHeader />
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          {unitsQuery.error ?? paymentsQuery.error ?? "We could not load payments."}
        </p>
        <Button
          variant="secondary"
          size="sm"
          className="rounded-full"
          onPress={() => {
            void unitsQuery.refresh();
            void paymentsQuery.reload();
          }}
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (!unitsQuery.loading && unitsQuery.apartments.length === 0) {
    return (
      <div className="p-4 md:p-6 space-y-2">
        <PaymentsHeader />
        <p className="text-sm text-zinc-500">No units found. Payments for your units will appear here.</p>
      </div>
    );
  }

  const loading = unitsQuery.loading || paymentsQuery.loading;
  const isFiltered = tab !== "all" || activeYear !== ALL_YEARS;
  const yearOptions = [
    { value: ALL_YEARS, label: "All years" },
    ...years.map((value) => ({ value, label: value })),
  ];

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PaymentsHeader />
        {loading ? <NeedsAttentionSkeleton /> : <NeedsAttentionCard payments={awaitingCash} showUnit={showUnit} />}
      </div>

      <div className="flex flex-wrap items-center gap-2" data-fab-clearance>
        <ComboBox
          aria-label="Apartment"
          className="w-full sm:w-72"
          menuTrigger="focus"
          isDisabled={unitsQuery.loading || unitsQuery.revalidating}
          selectedKey={activeApartmentId}
          onSelectionChange={(key) => {
            if (key) setApartmentId(String(key));
          }}
        >
          <ComboBox.InputGroup className="w-full">
            <Input placeholder={unitsQuery.loading ? "Loading apartments…" : "Search apartments"} />
            <ComboBox.Trigger />
          </ComboBox.InputGroup>
          <ComboBox.Popover>
            <ListBox renderEmptyState={() => <p className="px-3 py-2 text-sm text-muted-foreground">No apartments match.</p>}>
              {unitOptions.map((unit) => (
                <ListBox.Item key={unit.id} id={unit.id} textValue={unit.name}>
                  {unit.name}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </ComboBox.Popover>
        </ComboBox>
        <Button
          isIconOnly
          variant="outline"
          aria-label="Refresh payments"
          className="cursor-pointer rounded-xl border-border"
          isDisabled={loading}
          isPending={unitsQuery.revalidating || paymentsQuery.revalidating}
          onPress={() => {
            void unitsQuery.refresh();
            void paymentsQuery.reload();
          }}
        >
          <IconRefresh size={16} aria-hidden />
        </Button>
      </div>
      {unitsQuery.revalidating || paymentsQuery.revalidating ? <span role="status" className="sr-only">Updating payments</span> : null}

      {loading ? (
        <PaymentsBodySkeleton />
      ) : (
        <>
          <PaymentsSummary summary={summary} scopeLabel={activeYear === ALL_YEARS ? "All years" : activeYear} />

          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Tabs selectedKey={tab} onSelectionChange={(key) => setTab(String(key) as LedgerTab)} className="apt-status-tabs w-full sm:w-auto">
                <Tabs.ListContainer>
                  <Tabs.List aria-label="Payment status">
                    {TABS.map(({ id, label }) => (
                      <Tabs.Tab key={id} id={id}>
                        <span className="apt-tab-label">{label}</span>
                        {id === "pending" && tabCounts.pending > 0 ? (
                          <Badge color="danger" size="sm" placement="top-right">
                            {tabCounts.pending}
                          </Badge>
                        ) : null}
                        <Tabs.Indicator />
                      </Tabs.Tab>
                    ))}
                  </Tabs.List>
                </Tabs.ListContainer>
              </Tabs>
              <div className="flex items-center gap-2">
                <SettingsSelect label="Year" value={activeYear} options={yearOptions} onChange={setYear} className="w-32" />
                <SettingsSelect
                  label="Sort"
                  value={sort}
                  options={SORT_OPTIONS}
                  onChange={(value) => setSort(value as LedgerSort)}
                  className="w-32"
                />
              </div>
            </div>

            {rows.length === 0 ? (
              <Card className="rounded-2xl border border-dashed border-border bg-card">
                <Card.Content className="flex flex-col items-center gap-3 py-16 text-center">
                  <span className="rounded-full bg-muted p-5">
                    <Receipt size={32} className="text-primary" />
                  </span>
                  <p className="font-nunito text-base font-bold text-foreground">
                    {isFiltered ? "No payments found" : "No payments yet"}
                  </p>
                  <p className="max-w-sm text-sm text-muted-foreground">
                    {isFiltered
                      ? "Try another status or year to see more results."
                      : showUnit
                        ? "Payments for your units will appear here."
                        : "Payments for this unit will appear here."}
                  </p>
                  {isFiltered ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onPress={() => {
                        setTab("all");
                        setYear(ALL_YEARS);
                      }}
                    >
                      Clear filters
                    </Button>
                  ) : null}
                </Card.Content>
              </Card>
            ) : (
              <PaymentsTable payments={rows.map((row) => row.payment)} showUnit={showUnit} />
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function PaymentsPage() {
  return (
    <Suspense fallback={<PaymentsSkeleton />}>
      <PaymentsContent />
    </Suspense>
  );
}
