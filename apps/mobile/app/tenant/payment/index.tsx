import { View, Text } from "react-native";
import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { Button, Spinner } from "heroui-native";
import { IconCircleCheckFilled, IconHome } from "@tabler/icons-react-native";

import ScreenWrapper from "@/components/layout/ScreenWrapper";
import StandardHeader from "@/components/layout/StandardHeader";
import DetailField from "@/components/display/DetailField";
import ErrorDialog from "@/components/display/ErrorDialog";
import EmptyState from "@/components/display/EmptyState";
import { useColors } from "@/hooks/useTheme";
import PaymentSummaryCard from "./components/PaymentSummaryCard";
import PaymentMethodSelector from "./components/PaymentMethodSelector";
import PaymentFooter from "./components/PaymentFooter";
import CheckPaymentDialog from "./components/CheckPaymentDialog";
import {
  validateCashPayment,
  type CashPaymentErrors,
} from "./components/CashPaymentForm";

import {
  cancelCheckoutSession,
  createCheckoutSession,
  PaymongoError,
} from "@/service/payments/paymongoService";
import {
  createCashPayment,
  periodMonthLabel,
} from "@/service/payments/paymentService";
import { usePayments } from "@/hooks/payments";
import { useCurrentUser } from "@/hooks/auth";
import { useTenancy } from "@/hooks/tenancy/useTenancy";
import { useMaintenanceFocusRefresh } from "@/hooks/maintenance-requests/useMaintenanceFocusRefresh";
import { useAcceptedPaymentMethods } from "@/hooks/payments/useAcceptedPaymentMethods";

import { findPendingOnlinePayment, generatePaymentReference, getCurrentRentStatus, isMethodAccepted, type PaymentMethod } from "@repo/utils";
import { getBankLimitError, getBankTransferBank, type BankCode } from "@repo/constants";

const toIsoDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatLeaseDate = (iso: string | null): string => {
  if (!iso) return "—";
  const date = new Date(`${iso.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  }).format(date);
};

export default function PaymentCheckout() {
  const router = useRouter();
  const { colors } = useColors();

  const [cashPaymentDate, setCashPaymentDate] = useState<Date | null>(null);
  const [cashErrors, setCashErrors] = useState<CashPaymentErrors>({});
  const [paymentError, setPaymentError] = useState<{
    message: string;
    title?: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedBank, setSelectedBank] = useState<BankCode | null>(null);
  const [bankError, setBankError] = useState<string | undefined>();

  const { data: currentUser } = useCurrentUser();
  // Nothing is preselected: the tenant picks a method for each payment.
  const [selectedPaymentMethod, setActivePaymentMethod] = useState<PaymentMethod | null>(null);
  const {
    tenancy,
    loading: tenancyLoading,
    error: tenancyError,
    refetch,
  } = useTenancy();
  useMaintenanceFocusRefresh(tenancy?.apartment.id, currentUser?.id);
  const {
    acceptedMethods,
    loading: methodsLoading,
    error: methodsError,
    refetch: refetchMethods,
  } = useAcceptedPaymentMethods(currentUser?.id ?? null, tenancy?.id ?? null);
  // A choice the landlord has since turned off no longer counts.
  const activePaymentMethod =
    selectedPaymentMethod && isMethodAccepted(acceptedMethods, selectedPaymentMethod) ? selectedPaymentMethod : null;
  // Kept only for the already-paid guard — rent is always billed in full.
  const paymentsQuery = usePayments(tenancy?.id ?? null);

  const apartment = tenancy?.apartment ?? null;
  const bill = tenancy?.bill ?? null;
  // A tenancy without a server bill has no bill-listed fees: its pending maintenance fees
  // ride on this rent, as on the web checkout.
  const legacyFees = bill ? [] : tenancy?.legacyFees ?? [];
  const legacyFeesTotal = legacyFees.reduce((sum, fee) => sum + fee.amount, 0);
  const totalDue = bill?.totalDue ?? (tenancy?.monthly_rent ?? apartment?.monthly_rent ?? 0) + legacyFeesTotal;
  const landlord = tenancy?.landlord ?? null;
  const landlordName =
    landlord?.first_name || landlord?.last_name
      ? `${landlord?.first_name ?? ""} ${landlord?.last_name ?? ""}`.trim()
      : "—";

  // Full-amount policy: rent is always billed whole. A fully paid period
  // cannot be paid again (prevents double-payment/overpay).
  const period = getCurrentRentStatus(tenancy, paymentsQuery.data ?? []);
  // A tenancy on the server bill reports its own pending payment (bill.pendingPayment). Others
  // find an unfinished online checkout in the payment list: leaving PayMongo's page without
  // paying leaves it pending. Starting a new payment closes it, so Pay stays available.
  // Returning to this screen (for example from PayMongo's cancel page) shows the current
  // payment list, not the one cached before the attempt was closed.
  const refetchPayments = paymentsQuery.refetch;
  useFocusEffect(useCallback(() => {
    void refetchPayments({ cancelRefetch: false });
  }, [refetchPayments]));
  const unfinishedCheckout = bill ? null : findPendingOnlinePayment(paymentsQuery.data ?? [], period.periodStart);
  const [isCancellingCheckout, setIsCancellingCheckout] = useState(false);
  // Reference of the unfinished online payment whose "Check payment" dialog is open.
  const [checkingReference, setCheckingReference] = useState<string | null>(null);
  const { monthlyRent, isFullyPaid: isPeriodFullyPaid } = period;
  const monthLabel = periodMonthLabel(period.dueDate ?? period.periodStart);
  const yearLabel = period.periodStart.slice(0, 4);

  const clearCashErrors = () => setCashErrors({});

  const handleGoToSuccess = (referenceId: string) => {
    router.push(`/tenant/payment/success?referenceId=${referenceId}`);
  };

  const handleGoHome = () => {
    router.replace("/(tabs)/(tenant)/rentals");
  };

  const handleCancelCheckout = async () => {
    const referenceId = unfinishedCheckout?.reference_id;
    if (!referenceId || isCancellingCheckout) return;
    setIsCancellingCheckout(true);
    try {
      // PayMongo's answer decides: a payment that actually went through is shown as paid.
      const status = await cancelCheckoutSession(referenceId);
      if (status === "paid") handleGoToSuccess(referenceId);
    } catch (error) {
      setPaymentError({
        message: error instanceof PaymongoError ? error.reason : "Unable to cancel your payment. Please try again.",
      });
    } finally {
      setIsCancellingCheckout(false);
      void paymentsQuery.refetch();
      void refetch();
    }
  };

  const handlePay = async () => {
    if (isProcessing || bill?.pendingPayment || (bill ? bill.totalDue === 0 : isPeriodFullyPaid)) return;
    if (!activePaymentMethod) {
      setPaymentError({
        message: "Please select a payment method before proceeding.",
        title: "No Payment Method",
      });
      return;
    }

    if (!tenancy || !apartment) {
      setPaymentError({
        message: "No active rental found on this account.",
        title: "No Active Rental",
      });
      return;
    }

    const referenceId = generatePaymentReference();
    const paymentDescription = bill?.kind === "move_in"
      ? `Move-in payment - ${apartment.name}`
      : `Rent payment for ${monthLabel} ${yearLabel} - ${apartment.name}${legacyFeesTotal > 0 ? " (incl. maintenance fees)" : ""}`;
    const periodFields = {
      tenancyId: tenancy.id,
      periodStart: period.periodStart,
      periodEnd: period.periodEnd,
      dueDate: period.dueDate,
    };

    if (
      activePaymentMethod === "GCash" ||
      activePaymentMethod === "Maya" ||
      activePaymentMethod === "QRPh" ||
      activePaymentMethod === "Bank Transfer" ||
      activePaymentMethod === "Debit/Credit-Card"
    ) {
      if (activePaymentMethod === "Bank Transfer") {
        const bank = getBankTransferBank(selectedBank);
        const error = !bank ? "Choose a bank to continue." : getBankLimitError(bank, totalDue);
        setBankError(error ?? undefined);
        if (error) return;
      }
      setIsProcessing(true);
      try {
        const methodMap: Record<string, "gcash" | "maya" | "qrph" | "bank_transfer" | "card"> = {
          GCash: "gcash",
          Maya: "maya",
          QRPh: "qrph",
          "Bank Transfer": "bank_transfer",
          "Debit/Credit-Card": "card",
        };
        const session = await createCheckoutSession({
          referenceId,
          amount: totalDue,
          description: paymentDescription,
          redirectBaseUrl: Linking.createURL("/tenant/payment/verify"),
          method: methodMap[activePaymentMethod],
          ...(activePaymentMethod === "Bank Transfer" && selectedBank ? { bankCode: selectedBank } : {}),
          ...periodFields,
        });
        // Directly open PayMongo's hosted page: the tenant enters their wallet, bank or card
        // details there, never in APT.
        // PayMongo will redirect back to /tenant/payment/verify?sessionId=...
        // where verify.tsx (blue + Spinner) handles verification.
        try {
          await Linking.openURL(session.checkoutUrl);
        } catch {
          setPaymentError({
            message: "Unable to open checkout. Please try again.",
            title: "Checkout Failed",
          });
        }
      } catch (error) {
        setPaymentError({
          message:
            error instanceof PaymongoError
              ? error.reason
              : "Unable to start your payment. Please try again.",
        });
      } finally {
        setIsProcessing(false);
        void refetch();
        void paymentsQuery.refetch();
      }
    } else if (activePaymentMethod === "Cash") {
      const errors = validateCashPayment({ paymentDate: cashPaymentDate });
      if (Object.keys(errors).length > 0) {
        setCashErrors(errors);
        return;
      }
      if (!currentUser?.id) {
        setPaymentError({
          message: "We could not load your profile. Please try again.",
          title: "Profile Not Loaded",
        });
        return;
      }

      setIsProcessing(true);
      try {
        await createCashPayment({
          referenceId,
          amount: totalDue,
          date: toIsoDate(cashPaymentDate ?? new Date()),
          tenantId: currentUser.id,
          apartmentId: apartment.id,
          tenancyId: tenancy.id,
          periodStart: period.periodStart,
          periodEnd: period.periodEnd,
          dueDate: period.dueDate,
        });
        handleGoToSuccess(referenceId);
      } catch {
        setPaymentError({
          message: "Could not record your cash payment. Please try again.",
        });
      } finally {
        setIsProcessing(false);
        void refetch();
      }
    }
  };

  if (tenancyLoading) {
    return (
      <ScreenWrapper header={<StandardHeader title="Rent Payment" />}>
        <View className="flex-1 items-center justify-center">
          <Spinner size="lg" color={colors.primary} accessibilityLabel="Loading payment options" />
        </View>
      </ScreenWrapper>
    );
  }

  if (tenancyError || !tenancy || !apartment) {
    return (
      <ScreenWrapper
        header={<StandardHeader title="Rent Payment" />}
        className="p-5"
      >
        <EmptyState
          className="flex-1"
          icon={IconHome}
          title={tenancyError ? "Couldn't load your rental" : "No active rental found"}
          description={tenancyError ?? "There is no active rental on this account."}
          action={
            <Button
              size="sm"
              onPress={() => {
                void refetch();
              }}
            >
              <Button.Label>Try Again</Button.Label>
            </Button>
          }
        />
      </ScreenWrapper>
    );
  }

   if (bill ? bill.totalDue === 0 : isPeriodFullyPaid) {
    return (
      <ScreenWrapper
        header={<StandardHeader title="Rent Payment" />}
        className="p-5"
      >
        <View className="flex-1 justify-center">
          <EmptyState
            icon={IconCircleCheckFilled}
            iconColor={colors.success}
            title={bill?.coveredByAdvance ? "Covered by advance rent" : "Rent Already Paid"}
            description={`Your rent for ${monthLabel} ${yearLabel} ${bill?.coveredByAdvance ? "was prepaid in your move-in payment" : "has been paid in full"}. No further payment is needed.`}
          />
          <Button className="mt-4" onPress={handleGoHome}>
            <Button.Label>Go to Home</Button.Label>
          </Button>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper
      scrollable
      header={<StandardHeader title="Rent Payment" />}
      footer={
        <PaymentFooter
          totalPayment={totalDue}
          onPayPress={handlePay}
          isProcessing={isProcessing}
          isDisabled={!!bill?.pendingPayment || methodsLoading || methodsError !== null}
        />
      }
      className="p-5"
    >
      <View className="flex gap-3">
        <DetailField label="Apartment Name" value={apartment.name} />
        <DetailField
          label="Address"
          value={[apartment.street_address, apartment.barangay, apartment.city]
            .filter(Boolean)
            .join(", ")}
        />
        <DetailField label="Landlord Name" value={landlordName} />
        <View className="flex-row">
          <DetailField
            label="Lease Start"
            value={formatLeaseDate(tenancy.lease_start)}
          />
          <DetailField
            label="Lease End"
            value={formatLeaseDate(tenancy.lease_end)}
          />
        </View>
      </View>

      <PaymentSummaryCard
        month={monthLabel}
        year={yearLabel}
        dueDate={period.dueDate}
        monthlyRent={monthlyRent}
        bill={bill}
        fees={legacyFees}
      />

      {bill?.pendingPayment ? <View className="gap-3 mb-4">
        <Text className="text-foreground font-inter">A payment is awaiting confirmation. Check it before starting another payment.</Text>
        <Button variant="secondary" onPress={() => { void refetch(); }}><Button.Label>Refresh bill</Button.Label></Button>
        {bill.pendingPayment.referenceId ? <Button onPress={() => {
          if (bill.pendingPayment!.method === "cash") {
            router.push(`/tenant/payment/success?referenceId=${encodeURIComponent(bill.pendingPayment!.referenceId!)}`);
          } else {
            setCheckingReference(bill.pendingPayment!.referenceId!);
          }
        }}><Button.Label>Check payment</Button.Label></Button> : null}
      </View> : null}

      {unfinishedCheckout ? <View className="gap-3 mb-4">
        <Text className="text-foreground font-inter">
          You have an unfinished payment. Check it, cancel it, or start a new payment and it will be replaced.
        </Text>
        <Button onPress={() => setCheckingReference(unfinishedCheckout.reference_id!)}>
          <Button.Label>Check payment</Button.Label>
        </Button>
        <Button variant="secondary" isDisabled={isCancellingCheckout} onPress={() => { void handleCancelCheckout(); }}>
          <Button.Label>{isCancellingCheckout ? "Cancelling…" : "Cancel payment"}</Button.Label>
        </Button>
      </View> : null}

      <PaymentMethodSelector
        selectedMethod={activePaymentMethod}
        onPaymentMethodChange={setActivePaymentMethod}
        cashPaymentDate={cashPaymentDate}
        onCashPaymentDateChange={(date) => {
          setCashPaymentDate(date);
          clearCashErrors();
        }}
        cashErrors={cashErrors}
        acceptedMethods={acceptedMethods}
        methodsLoading={methodsLoading}
        methodsError={methodsError}
        onRetryMethods={() => { void refetchMethods(); }}
        amount={totalDue}
        selectedBank={selectedBank}
        onBankChange={(bank) => { setSelectedBank(bank); setBankError(undefined); }}
        bankError={bankError}
      />

      <CheckPaymentDialog
        referenceId={checkingReference}
        isOpen={checkingReference !== null}
        onOpenChange={(open) => { if (!open) setCheckingReference(null); }}
        onPaid={handleGoToSuccess}
      />

      <ErrorDialog
        isOpen={paymentError !== null}
        onClose={() => setPaymentError(null)}
        message={paymentError?.message ?? ""}
        title={paymentError?.title ?? "Payment Failed"}
      />
    </ScreenWrapper>
  );
}
