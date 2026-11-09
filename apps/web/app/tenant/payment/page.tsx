"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@heroui/react";
import { IconCalendar as CalendarDays, IconHome as House, IconMapPin as MapPin, IconCircleCheck as CheckCircle2 } from "@tabler/icons-react";
import { formatPesoDisplay, generatePaymentReference, getCurrentRentStatus, paidAmountForPeriod, isMethodAccepted, findPendingOnlinePayment } from "@repo/utils";
import { getBankLimitError, getBankTransferBank, type BankCode } from "@repo/constants";
import type { PaymentMethod } from "./types";
import { formatLeaseDate, periodMonthLabel } from "./utils";
import { createCashPayment } from "@/service/paymentService";
import { cancelCheckoutSession, createCheckoutSession, PaymongoError } from "@/service/paymongoService";
import { usePayments } from "@/hooks/use-payments";
import { useTenancy } from "@/hooks/use-tenancy";
import { useUser } from "@/hooks/use-user";
import StatusChip from "@/app/components/display/StatusChip";
import UserAvatar from "@/app/components/profile/UserAvatar";
import PaymentSummaryCard from "./components/PaymentSummaryCard";
import PaymentMethodSelector from "./components/PaymentMethodSelector";
import { PaymentPageHeader, PaymentPageShell } from "./components/PaymentPageLayout";
import PaymentPageSkeleton from "./components/PaymentPageSkeleton";
import PaymentFooter from "./components/PaymentFooter";
import type { CashPaymentErrors } from "./types";
import { validateCashPayment } from "./components/CashPaymentForm";
import { useAcceptedPaymentMethods } from "@/hooks/use-accepted-payment-methods";
import ErrorDialog from "@/app/components/display/ErrorDialog";

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function PaymentContent() {
  // Nothing is preselected: the tenant picks a method for each payment.
  const [requestedMethod, setActiveMethod] = useState<PaymentMethod | null>(null);
  const [selectedBank, setSelectedBank] = useState<BankCode | null>(null);
  const [bankError, setBankError] = useState<string | undefined>();
  const [cashDate, setCashDate] = useState<Date | null>(null);
  const [cashErrors, setCashErrors] = useState<CashPaymentErrors>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<{ message: string; title?: string } | null>(null);
  const router = useRouter();

  const { profile } = useUser();
  const {
    tenancy,
    currentPayment,
    loading: tenancyLoading,
    error: tenancyError,
    financeLoading,
    financeError,
    retryFinance,
    revalidate,
    refetch,
  } = useTenancy();
  const paymentsQuery = usePayments(tenancy?.id ?? null);
  const {
    acceptedMethods,
    loading: methodsLoading,
    error: methodsError,
    refresh: refreshMethods,
  } = useAcceptedPaymentMethods(tenancy?.id ?? null);

  const apartment = tenancy?.apartment ?? null;
  const bill = tenancy?.bill ?? null;
  const landlord = tenancy?.landlord ?? null;
  // The period being billed now, same rule as mobile and the server's rent
  // reminders: starts with the lease, due on the tenancy's due day.
  const period = getCurrentRentStatus(
    tenancy ? { ...tenancy, currentPayment } : null,
    paymentsQuery.data ?? [],
  );
  const { monthlyRent } = period;

  // Pending maintenance fees ride on top of this period's rent.
  const [legacyFees, setPendingFees] = useState<{ title: string; amount: number }[]>([]);
  const apartmentIdForFees = apartment?.id ?? null;
  const tenancyIdForFees = tenancy?.id ?? null;
  useEffect(() => {
    if (financeLoading || financeError) return;
    if (!apartmentIdForFees || !tenancyIdForFees || bill) return;
    const apartmentId = apartmentIdForFees;
    const tenancyId = tenancyIdForFees;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      void (async () => {
        try {
          const { getTenantContext } = await import("@/service/favoritesService");
          const context = await getTenantContext();
          if (!context.tenantId || cancelled) return;
          const { fetchPendingMaintenanceFees } = await import("@/service/maintenanceService");
          const fees = await fetchPendingMaintenanceFees(apartmentId, context.tenantId, tenancyId);
          if (!cancelled) setPendingFees(fees);
        } catch {
          // Additive info only — a failed lookup must not block payment.
        }
      })();
    });
    return () => {
      cancelled = true;
    };
  }, [apartmentIdForFees, tenancyIdForFees, bill, financeError, financeLoading]);

  const pendingFees = bill?.fees ?? legacyFees;
  const feesTotal = pendingFees.reduce((sum, fee) => sum + fee.amount, 0);
  const totalDue = bill?.totalDue ?? monthlyRent + feesTotal;

  const monthLabel = periodMonthLabel(period.dueDate ?? period.periodStart);
  const yearLabel = period.periodStart.slice(0, 4);

  // Full-amount policy: rent + pending fees are always billed whole. A fully
  // paid period cannot be paid again (prevents double-payment/overpay). With
  // no pending fees this is the shared `period.isFullyPaid`.
  const isPeriodPaid = bill ? totalDue === 0 :
    totalDue > 0 && paidAmountForPeriod(paymentsQuery.data ?? [], period.periodStart) >= totalDue;
  const pendingPayment = bill?.pendingPayment;
  // A tenancy on the server bill reports its own pending payment (bill.pendingPayment). Others
  // find an unfinished online checkout in the payment list: leaving PayMongo's page without
  // paying leaves it pending. Starting a new payment closes it, so Pay stays available.
  const unfinishedCheckout = bill ? null : findPendingOnlinePayment(paymentsQuery.data ?? [], period.periodStart);
  const [isCancellingCheckout, setIsCancellingCheckout] = useState(false);

  const handleCancelCheckout = async () => {
    const referenceId = unfinishedCheckout?.reference_id;
    if (!referenceId || isCancellingCheckout) return;
    setIsCancellingCheckout(true);
    try {
      // PayMongo's answer decides: a payment that actually went through is shown as paid.
      const status = await cancelCheckoutSession(referenceId);
      if (status === "paid") router.push(`/tenant/payment/success?referenceId=${encodeURIComponent(referenceId)}`);
    } catch (error) {
      setPaymentError({
        message: error instanceof PaymongoError ? error.reason : "Unable to cancel your payment. Please try again.",
      });
    } finally {
      setIsCancellingCheckout(false);
      void paymentsQuery.refetch();
      void revalidate();
    }
  };
  const isCashPaymentPending = (paymentsQuery.data ?? []).some(
    (payment) =>
      payment.method === "cash" &&
      payment.status === "pending" &&
      payment.period_start === period.periodStart,
  );

  const landlordName =
    landlord?.first_name || landlord?.last_name
      ? `${landlord?.first_name ?? ""} ${landlord?.last_name ?? ""}`.trim()
      : "—";
  const address = apartment
    ? [apartment.street_address, apartment.barangay, apartment.city, apartment.province].filter(Boolean).join(", ")
    : "—";
  const apartmentImage =
    apartment?.apartment_images?.find((image) => image.is_cover)?.url ??
    apartment?.apartment_images?.[0]?.url ??
    null;

  // A choice the landlord has since turned off no longer counts.
  const activeMethod = requestedMethod && isMethodAccepted(acceptedMethods, requestedMethod) ? requestedMethod : null;

  const handlePay = async () => {
    if (isProcessing || isPeriodPaid || pendingPayment || paymentsQuery.error) return;
    if (!activeMethod) {
      setPaymentError({ message: "Please select a payment method before proceeding.", title: "No Payment Method" });
      return;
    }
    if (activeMethod === "Cash" && isCashPaymentPending) {
      setPaymentError({
        title: "Cash Payment Pending",
        message: "Your cash payment is awaiting landlord confirmation. You can submit another request only if it is declined.",
      });
      return;
    }
    if (!tenancy || !apartment) {
      setPaymentError({ message: "No active rental found on this account.", title: "No Active Rental" });
      return;
    }

    const referenceId = generatePaymentReference();
    const paymentDescription = bill?.kind === "move_in"
      ? `Move-in payment - ${apartment.name} (first rent, deposit and month 2 advance)`
      : feesTotal > 0
        ? `Rent payment for ${monthLabel} ${yearLabel} - ${apartment.name} (incl. maintenance fees)`
        : `Rent payment for ${monthLabel} ${yearLabel} - ${apartment.name}`;
    const amount = totalDue;
    const periodFields = {
      tenancyId: tenancy.id,
      periodStart: period.periodStart,
      periodEnd: period.periodEnd,
      dueDate: period.dueDate,
    };

    if (activeMethod === "GCash" || activeMethod === "Maya" || activeMethod === "QRPh" || activeMethod === "Bank Transfer" || activeMethod === "Debit/Credit-Card") {
      if (activeMethod === "Bank Transfer") {
        const bank = getBankTransferBank(selectedBank);
        const bankProblem = !bank ? "Choose a bank to continue." : getBankLimitError(bank, amount);
        setBankError(bankProblem ?? undefined);
        if (bankProblem) return;
      }
      setIsProcessing(true);
      try {
        // Every method is paid on PayMongo's hosted page: the tenant enters their wallet, bank or
        // card details there, never in APT.
        const methodMap: Record<string, "gcash" | "maya" | "qrph" | "bank_transfer" | "card"> = {
          GCash: "gcash",
          Maya: "maya",
          QRPh: "qrph",
          "Bank Transfer": "bank_transfer",
          "Debit/Credit-Card": "card",
        };
        const session = await createCheckoutSession({
          referenceId,
          amount,
          description: paymentDescription,
          redirectBaseUrl: `${window.location.origin}/tenant/payment/verify`,
          method: methodMap[activeMethod],
          ...(activeMethod === "Bank Transfer" && selectedBank ? { bankCode: selectedBank } : {}),
          ...periodFields,
        });
        window.location.href = session.checkoutUrl;
      } catch (error) {
        setPaymentError({
          message: error instanceof PaymongoError ? error.reason : "Unable to start your payment. Please try again.",
        });
      } finally {
        setIsProcessing(false);
        void revalidate();
      }
    } else if (activeMethod === "Cash") {
      const errs = validateCashPayment({ paymentDate: cashDate });
      if (Object.keys(errs).length > 0) {
        setCashErrors(errs);
        return;
      }
      if (!profile?.id) {
        setPaymentError({ message: "No active rental found on this account.", title: "No Active Rental" });
        return;
      }
      setIsProcessing(true);
      try {
        await createCashPayment({
          referenceId,
          amount,
          date: toIsoDate(cashDate ?? new Date()),
          tenantId: profile.id,
          apartmentId: apartment.id,
          tenancyId: tenancy.id,
          periodStart: period.periodStart,
          periodEnd: period.periodEnd,
          dueDate: period.dueDate,
        });
        router.push(`/tenant/payment/success?referenceId=${referenceId}`);
      } catch (error) {
        const detail =
          error instanceof Error
            ? error.message
            : typeof error === "object" && error !== null
              ? [
                  (error as { message?: unknown }).message,
                  (error as { code?: unknown }).code
                    ? `(code ${String((error as { code?: unknown }).code)})`
                    : "",
                  (error as { details?: unknown }).details
                    ? String((error as { details?: unknown }).details)
                    : "",
                ]
                  .filter((p): p is string => typeof p === "string" && p.length > 0)
                  .join(" ") || "Unknown error."
              : "Unknown error.";
        console.error("createCashPayment failed:", detail, error);
        setPaymentError({ message: `Could not record your cash payment. Please try again. (${detail})` });
      } finally {
        setIsProcessing(false);
        void revalidate();
      }
    }
  };

  if (tenancyLoading || financeLoading || paymentsQuery.loading) {
    return <PaymentPageSkeleton />;
  }

  if (tenancyError || financeError || paymentsQuery.error || !tenancy || !apartment) {
    return (
      <PaymentPageShell>
        <PaymentPageHeader />
        <Card className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-none">
          <Card.Content className="py-16 flex flex-col items-center gap-4 text-center px-6">
            <p className="text-lg font-nunito font-semibold text-zinc-900 dark:text-zinc-100">
              {tenancyError ?? financeError ?? paymentsQuery.error ?? "No active rental found on this account."}
            </p>
            <Button onPress={() => { void refetch(); void retryFinance(); void paymentsQuery.refetch(); }} className="rounded-full font-nunito">
              Try Again
            </Button>
          </Card.Content>
        </Card>
      </PaymentPageShell>
    );
  }

  return (
    <>
      <PaymentPageShell>
        <PaymentPageHeader />

        {/* Non-blocking paid notice — page stays interactive, Pay grays out below */}
        {isPeriodPaid && (
          <Card className="rounded-2xl border border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-950/30">
            <Card.Content className="p-4 flex flex-row items-center gap-3">
              <span className="rounded-full bg-green-600 p-2 text-white shrink-0">
                <CheckCircle2 size={18} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-nunito font-semibold text-green-800 dark:text-green-200">{bill?.coveredByAdvance ? "Covered by advance rent" : "Rent already paid"}</p>
                <p className="text-xs text-green-700/80 dark:text-green-300/80">
                  Your rent for {monthLabel} {yearLabel} {bill?.coveredByAdvance ? "was prepaid in your move-in payment." : "has been paid in full."} No further payment is needed.
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onPress={() => router.push("/tenant/payment/history")}
                className="text-green-700 shrink-0"
              >
                View history
              </Button>
            </Card.Content>
          </Card>
        )}

        {pendingPayment && (
          <Card className="rounded-2xl border border-border bg-card shadow-none">
            <Card.Content className="flex flex-wrap items-center justify-between gap-3 p-4">
              <p className="text-sm text-foreground">
                {pendingPayment.method === "cash" ? "Your payment is awaiting landlord confirmation." : "Your checkout is awaiting confirmation. Check its status before starting another payment."}
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onPress={() => { void refetch(); void retryFinance(); }}>Refresh bill</Button>
                {pendingPayment.referenceId && <Button size="sm" onPress={() => router.push(pendingPayment.method === "cash"
                  ? `/tenant/payment/success?referenceId=${encodeURIComponent(pendingPayment.referenceId!)}`
                  : `/tenant/payment/verify?sessionId=${encodeURIComponent(pendingPayment.referenceId!)}`)}>Check payment</Button>}
              </div>
            </Card.Content>
          </Card>
        )}

        {unfinishedCheckout && (
          <Card className="rounded-2xl border border-border bg-card shadow-none">
            <Card.Content className="flex flex-wrap items-center justify-between gap-3 p-4">
              <p className="text-sm text-foreground">
                You have an unfinished payment. Check it, cancel it, or start a new payment and it will be replaced.
              </p>
              <div className="flex gap-2">
                <Button size="sm" onPress={() => router.push(`/tenant/payment/verify?sessionId=${encodeURIComponent(unfinishedCheckout.reference_id!)}`)}>
                  Check payment
                </Button>
                <Button variant="secondary" size="sm" isDisabled={isCancellingCheckout} onPress={() => void handleCancelCheckout()}>
                  {isCancellingCheckout ? "Cancelling…" : "Cancel payment"}
                </Button>
              </div>
            </Card.Content>
          </Card>
        )}

        {/* Main grid — row 1 top cards share equal height via items-stretch */}
        <div className="grid gap-4 lg:grid-cols-3 items-stretch">
          {/* Row 1, left: lease details */}
          <div className="lg:col-span-2 h-full">
            <Card className="h-full rounded-2xl border border-border bg-card shadow-none">
              <Card.Content className="p-4">
                <div className="grid gap-4 lg:grid-cols-[13.5rem_minmax(0,1fr)]">
                  {apartmentImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={apartmentImage} alt={apartment.name} className="h-44 w-full rounded-xl object-cover lg:h-full" />
                  ) : (
                    <div className="flex h-44 items-center justify-center rounded-xl bg-muted text-muted-foreground lg:h-full" aria-label="No apartment photo available">
                      <House size={32} aria-hidden="true" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="border-b border-border pb-3">
                      <h3 className="flex items-center gap-2 text-lg font-nunito font-semibold text-foreground">
                        <House size={20} className="shrink-0 text-primary" /> {apartment.name}
                      </h3>
                      <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
                        <MapPin size={16} className="mt-0.5 shrink-0" /> <span>{address}</span>
                      </p>
                    </div>

                    <div className="mt-3 flex items-center gap-3">
                      <UserAvatar
                        src={landlord?.avatar_url}
                        initials={`${landlord?.first_name?.[0] ?? "—"}${landlord?.last_name?.[0] ?? ""}`}
                        alt={landlordName}
                        size="md"
                        fallbackClassName="bg-primary text-white text-sm"
                      />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Landlord</p>
                        <p className="truncate text-base font-nunito font-semibold text-foreground">{landlordName}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-border bg-card p-3">
                    <p className="text-xs font-nunito font-semibold uppercase tracking-wider text-muted-foreground">Lease start</p>
                    <p className="mt-1 flex items-center gap-1.5 text-base font-nunito font-semibold text-foreground">
                      <CalendarDays size={16} className="text-muted-foreground" /> {formatLeaseDate(tenancy.lease_start)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-3">
                    <p className="text-xs font-nunito font-semibold uppercase tracking-wider text-muted-foreground">Lease end</p>
                    <p className="mt-1 flex items-center gap-1.5 text-base font-nunito font-semibold text-foreground">
                      <CalendarDays size={16} className="text-muted-foreground" /> {formatLeaseDate(tenancy.lease_end)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-3">
                    <StatusChip size="sm" tone="success">Active lease</StatusChip>
                    <p className="mt-1 text-base font-nunito font-bold text-foreground">{formatPesoDisplay(monthlyRent)} <span className="font-nunito font-semibold text-muted-foreground">/ month</span></p>
                  </div>
                </div>
              </Card.Content>
            </Card>
          </div>

          {/* Row 1, right: payment summary (display-only, mobile parity) */}
          <div className="h-full">
            <PaymentSummaryCard month={monthLabel} year={yearLabel} dueDate={period.dueDate} monthlyRent={monthlyRent} fees={pendingFees} bill={bill} className="h-full" />
          </div>

          {/* Row 2: payment method (full width) */}
          <div className="lg:col-span-3 space-y-4">
            <PaymentMethodSelector
              selectedMethod={activeMethod}
              onPaymentMethodChange={(method) => {
                setActiveMethod(method);
                setPaymentError(null);
              }}
              cashPaymentDate={cashDate}
              onCashPaymentDateChange={(d) => {
                setCashDate(d);
                setCashErrors({});
              }}
              cashErrors={cashErrors}
              isCashPaymentPending={isCashPaymentPending}
              acceptedMethods={acceptedMethods}
              methodsLoading={methodsLoading}
              methodsError={methodsError}
              onRetryMethods={() => void refreshMethods()}
              amount={totalDue}
              selectedBank={selectedBank}
              onBankChange={(bank) => {
                setSelectedBank(bank);
                setBankError(undefined);
              }}
              bankError={bankError}
            />
          </div>
        </div>

        {/* Pay footer — in-flow sticky (never overlays inputs, mobile footer
            parity). `data-fab-clearance` keeps the floating notifications
            bell off the Pay button. */}
        <div data-fab-clearance="payment-footer" className="sticky bottom-4 z-20 mt-4">
          <PaymentFooter totalPayment={totalDue} onPayPress={() => void handlePay()} isProcessing={isProcessing} isDisabled={isPeriodPaid || !!pendingPayment || methodsLoading || methodsError !== null || (activeMethod === "Cash" && isCashPaymentPending)} />
        </div>
      </PaymentPageShell>

      {/* Crucial errors get a modal (shared ErrorDialog, mobile parity);
          field-level ones stay inline. */}
      <ErrorDialog
        message={paymentError?.message ?? null}
        title={paymentError?.title ?? "Payment Failed"}
        onClose={() => setPaymentError(null)}
      />
    </>
  );
}

export default function TenantPaymentPage() {
  return <PaymentContent />;
}
