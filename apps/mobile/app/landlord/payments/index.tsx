import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button, Spinner } from "heroui-native";
import { IconWallet } from "@tabler/icons-react-native";

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
import FinanceTabs from "@/components/finance/FinanceTabs";
import CashToConfirmCard from "@/components/landlord-payments/CashToConfirmCard";
import LandlordPaymentsSummary from "@/components/landlord-payments/LandlordPaymentsSummary";
import { useAllLandlordPayments } from "@/hooks/landlord";
import { useColors } from "@/hooks/useTheme";
import type { LandlordPaymentWithUnit } from "@/service/landlord/landlordService";

import PaymentHistoryCard from "../manage-apartment/[apartmentId]/components/PaymentHistoryCard";

const PAGE_SIZE = 30;

const TAB_OPTIONS: { value: LedgerTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "paid", label: "Paid" },
  { value: "pending", label: "Pending" },
  { value: "declined", label: "Declined" },
];

const SORT_OPTIONS: { value: LedgerSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
];

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
  const yearOptions = [{ value: ALL_YEARS, label: "All years" }, ...years.map((value) => ({ value, label: value }))];

  const changeTab = (value: string) => {
    setTab(value as LedgerTab);
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
      <ScreenWrapper header={header}>
        <View className="flex-1 items-center justify-center">
          <Spinner size="lg" color={colors.primary} accessibilityLabel="Loading payments" />
        </View>
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

        <FinanceTabs value={tab} options={TAB_OPTIONS} onChange={changeTab} />

        <View className="flex-row gap-3">
          <View className="flex-1">
            <FinanceSelect
              label="Year"
              value={activeYear}
              options={yearOptions}
              onChange={(value) => {
                setYear(value);
                setShown(PAGE_SIZE);
              }}
              sheetHeight="50%"
            />
          </View>
          <View className="flex-1">
            <FinanceSelect
              label="Sort"
              value={sort}
              options={SORT_OPTIONS}
              onChange={(value) => setSort(value as LedgerSort)}
              sheetHeight="35%"
            />
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
    </ScreenWrapper>
  );
}
