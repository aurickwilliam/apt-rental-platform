import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button } from "heroui-native";
import { IconFilter2, IconWallet } from "@tabler/icons-react-native";

import {
  ALL_APARTMENTS,
  ALL_YEARS,
  availableLedgerYears,
  filterLedgerByYear,
  isAwaitingCashConfirmation,
  ledgerDateLabel,
  ledgerPeriodLabel,
  matchesLedgerTab,
  sortLedger,
  summarizeLedger,
  type LedgerSort,
  type LedgerTab,
} from "@repo/utils";

import ScreenWrapper from "@/components/layout/ScreenWrapper";
import StandardHeader from "@/components/layout/StandardHeader";
import EmptyState from "@/components/display/EmptyState";
import FinanceSelect from "@/components/finance/FinanceSelect";
import DropdownButton from "@/components/buttons/DropdownButton";
import CashToConfirmCard from "@/components/landlord-payments/CashToConfirmCard";
import LandlordPaymentsSkeleton from "@/components/landlord-payments/LandlordPaymentsSkeleton";
import LandlordPaymentsSummary from "@/components/landlord-payments/LandlordPaymentsSummary";
import PaymentFilterSheet from "@/components/landlord-payments/PaymentFilterSheet";
import { useAllLandlordPayments } from "@/hooks/landlord";
import { useColors } from "@/hooks/useTheme";
import type { LandlordPaymentWithUnit } from "@/service/landlord/landlordService";

import PaymentHistoryCard from "../manage-apartment/[apartmentId]/components/PaymentHistoryCard";

const PAGE_SIZE = 30;

// The status menu's labels; "All payments" reads naturally on the closed menu.
const TAB_OPTIONS: { value: LedgerTab; label: string }[] = [
  { value: "all", label: "All payments" },
  { value: "paid", label: "Paid" },
  { value: "pending", label: "Pending" },
  { value: "declined", label: "Declined" },
];

const SORT_OPTIONS: { value: LedgerSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
];

const ALL_YEARS_LABEL = "All years";

const STATUS_TRIGGER_CLASS =
  "bg-surface px-4 py-3 rounded-2xl flex-row items-center justify-between gap-2 border border-field-border";

const isTab = (value: string | undefined): value is LedgerTab =>
  TAB_OPTIONS.some((option) => option.value === value);

// Every payment across the landlord's units, one list. The Dashboard opens it on
// "Pending" when cash is waiting; the unit screen keeps its own per-unit history.
export default function LandlordPaymentsScreen() {
  const router = useRouter();
  const { colors } = useColors();
  const params = useLocalSearchParams<{ status?: string }>();
  const { units, payments, isLoading, error, refetch, isRefetching } = useAllLandlordPayments();

  const [unitId, setUnitId] = useState<string>(ALL_APARTMENTS);
  const [tab, setTab] = useState<LedgerTab>(isTab(params.status) ? params.status : "all");
  const [year, setYear] = useState<string>(ALL_YEARS);
  const [sort, setSort] = useState<LedgerSort>("newest");
  const [shown, setShown] = useState(PAGE_SIZE);
  const [filterOpen, setFilterOpen] = useState(false);

  // A unit that is no longer in the list falls back to every unit.
  const activeUnitId = units.some((unit) => unit.id === unitId) ? unitId : ALL_APARTMENTS;
  const showUnit = activeUnitId === ALL_APARTMENTS;

  const inUnit = useMemo(
    () => (showUnit ? payments : payments.filter((payment) => payment.apartment_id === activeUnitId)),
    [payments, activeUnitId, showUnit],
  );
  const years = useMemo(() => availableLedgerYears(inUnit), [inUnit]);
  // A year the selected unit has no payments in falls back to every year.
  const activeYear = year === ALL_YEARS || years.includes(year) ? year : ALL_YEARS;

  const inYear = useMemo(() => filterLedgerByYear(inUnit, activeYear), [inUnit, activeYear]);
  const summary = useMemo(() => summarizeLedger(inYear), [inYear]);
  const rows = useMemo(
    () => sortLedger(inYear.filter((payment) => matchesLedgerTab(payment, tab)), sort),
    [inYear, tab, sort],
  );
  const awaitingCash = useMemo(() => inUnit.filter(isAwaitingCashConfirmation), [inUnit]);
  const awaitingAmount = awaitingCash.reduce((sum, payment) => sum + (payment.amount ?? 0), 0);
  const visibleRows = rows.slice(0, shown);

  const unitOptions = [
    { value: ALL_APARTMENTS, label: "All apartments" },
    ...units.map((unit) => ({ value: unit.id, label: unit.name })),
  ];
  const yearLabels = [ALL_YEARS_LABEL, ...years];
  const activeFilters = (activeYear !== ALL_YEARS ? 1 : 0) + (sort !== "newest" ? 1 : 0);
  const statusLabel = TAB_OPTIONS.find((option) => option.value === tab)?.label ?? TAB_OPTIONS[0].label;
  const sortLabel = SORT_OPTIONS.find((option) => option.value === sort)?.label ?? SORT_OPTIONS[0].label;

  const changeTab = (value: LedgerTab) => {
    setTab(value);
    setShown(PAGE_SIZE);
  };

  const resetFilters = () => {
    setYear(ALL_YEARS);
    setSort("newest");
    setShown(PAGE_SIZE);
  };

  const openReceipt = (payment: LandlordPaymentWithUnit) =>
    router.push({
      pathname: "/landlord/manage-apartment/[apartmentId]/payment-history/[paymentId]",
      params: { apartmentId: payment.apartment_id, paymentId: payment.id },
    });

  const header = <StandardHeader title="Payments" />;

  if (isLoading) {
    return (
      <ScreenWrapper header={header} scrollable className="p-5">
        <LandlordPaymentsSkeleton />
      </ScreenWrapper>
    );
  }

  if (error) {
    return (
      <ScreenWrapper header={header} className="p-5">
        <View className="flex-1 items-center justify-center gap-4">
          <Text className="text-foreground text-lg font-nunitoSemiBold text-center">
            We could not load your payments.
          </Text>
          <Button onPress={() => void refetch()}>
            <Button.Label>Try Again</Button.Label>
          </Button>
        </View>
      </ScreenWrapper>
    );
  }

  if (units.length === 0) {
    return (
      <ScreenWrapper header={header} className="p-5">
        <EmptyState
          icon={<IconWallet size={48} color={colors.primary} />}
          title="No units yet"
          description="Payments for your units will appear here."
        />
      </ScreenWrapper>
    );
  }

  const isFiltered = tab !== "all" || activeYear !== ALL_YEARS;

  return (
    <ScreenWrapper
      header={header}
      scrollable
      className="p-5"
      refreshing={isRefetching}
      onRefresh={() => void refetch()}
    >
      <View className="gap-4">
        <FinanceSelect
          label="Apartment"
          value={activeUnitId}
          options={unitOptions}
          onChange={(value) => {
            setUnitId(value);
            setShown(PAGE_SIZE);
          }}
          searchable
          highlightSelection
        />

        <LandlordPaymentsSummary
          summary={summary}
          scopeLabel={activeYear === ALL_YEARS ? "All years" : activeYear}
          onPressCashToConfirm={() => changeTab("pending")}
        />

        {awaitingCash.length > 0 ? (
          <CashToConfirmCard
            count={awaitingCash.length}
            amount={awaitingAmount}
            onPress={() => changeTab("pending")}
          />
        ) : null}

        <View className="flex-row items-center gap-3">
          <View className="flex-1">
            <DropdownButton
              options={TAB_OPTIONS.map((option) => option.label)}
              value={statusLabel}
              onSelect={(label) => {
                const next = TAB_OPTIONS.find((option) => option.label === label);
                if (next) changeTab(next.value);
              }}
              width="trigger"
              align="start"
              highlightSelected
              buttonClassName={STATUS_TRIGGER_CLASS}
              textClassName="text-foreground text-base font-inter flex-1"
            />
          </View>

          <View className="relative">
            <Pressable
              onPress={() => setFilterOpen(true)}
              accessibilityRole="button"
              accessibilityLabel={activeFilters > 0 ? `Filters, ${activeFilters} active` : "Filters"}
              className="size-12 rounded-full bg-primary-light items-center justify-center active:opacity-70"
            >
              <IconFilter2 size={22} color={colors.primary} />
            </Pressable>
            {activeFilters > 0 ? (
              <View className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-primary items-center justify-center">
                <Text className="text-white text-[11px] font-nunitoBold">{activeFilters}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {rows.length === 0 ? (
          <View className="items-center gap-3 py-12">
            <IconWallet size={56} color={colors.primary} />
            <Text className="text-xl font-nunitoBold text-foreground">
              {isFiltered ? "No payments found" : "No payments yet"}
            </Text>
            <Text className="text-gray-400 text-base font-inter text-center px-8">
              {isFiltered
                ? "Try another status or year to see more results."
                : showUnit
                  ? "Payments for your units will appear here."
                  : "Payments for this unit will appear here."}
            </Text>
            {isFiltered ? (
              <Button
                variant="secondary"
                onPress={() => {
                  setTab("all");
                  setYear(ALL_YEARS);
                }}
              >
                <Button.Label>Clear filters</Button.Label>
              </Button>
            ) : null}
          </View>
        ) : (
          <View className="gap-2">
            {visibleRows.map((payment) => (
              <PaymentHistoryCard
                key={payment.id}
                month={ledgerPeriodLabel(payment.due_date ?? payment.period_start ?? payment.date)}
                amount={payment.amount ?? 0}
                paidDate={ledgerDateLabel(payment.date)}
                status={payment.status}
                method={payment.method}
                referenceId={payment.reference_id}
                unitName={showUnit ? payment.apartment_name : null}
                tenantName={payment.tenant_name}
                onPress={() => openReceipt(payment)}
              />
            ))}
            {rows.length > visibleRows.length ? (
              <Button variant="secondary" onPress={() => setShown((count) => count + PAGE_SIZE)}>
                <Button.Label>
                  Show more ({rows.length - visibleRows.length} left)
                </Button.Label>
              </Button>
            ) : null}
          </View>
        )}
      </View>

      <PaymentFilterSheet
        isOpen={filterOpen}
        onOpenChange={setFilterOpen}
        yearOptions={yearLabels}
        year={activeYear === ALL_YEARS ? ALL_YEARS_LABEL : activeYear}
        onYearChange={(label) => {
          setYear(label === ALL_YEARS_LABEL ? ALL_YEARS : label);
          setShown(PAGE_SIZE);
        }}
        sortOptions={SORT_OPTIONS.map((option) => option.label)}
        sort={sortLabel}
        onSortChange={(label) => {
          const next = SORT_OPTIONS.find((option) => option.label === label);
          if (next) setSort(next.value);
        }}
        onReset={resetFilters}
        isChanged={activeFilters > 0}
      />
    </ScreenWrapper>
  );
}
