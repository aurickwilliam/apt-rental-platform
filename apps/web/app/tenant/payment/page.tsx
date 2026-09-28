"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Button, Card, Chip, Modal, Spinner, useOverlayState } from "@heroui/react";
import { Banknote, CalendarDays, House, MapPin, User, ArrowLeft, CheckCircle2 } from "lucide-react";
import { formatPesoDisplay } from "@repo/utils";
import { validateCardInfo, type CardFormErrors } from "@repo/utils";
import type { CardInformation, PaymentMethod } from "./types";
import { formatLeaseDate, periodMonthLabel } from "./utils";
import { paidAmountForPeriod, resolvePaymentPeriod, createCashPayment } from "@/service/paymentService";
import { createCardPayment, createCheckoutSession, PaymongoError } from "@/service/paymongoService";
import { usePayments } from "@/hooks/use-payments";
import { useTenancy } from "@/hooks/use-tenancy";
import { useUser } from "@/hooks/use-user";
import PaymentSummaryCard from "./components/PaymentSummaryCard";
import PaymentMethodSelector from "./components/PaymentMethodSelector";
import PaymentFooter from "./components/PaymentFooter";
import type { CashPaymentErrors } from "./types";
import { validateCashPayment } from "./components/CashPaymentForm";

const INITIAL_CARD: CardInformation = {
  cardNumber: "",
  expiryDate: "",
  cardholderName: "",
  cvv: "",
  isPaymentSaved: false,
  isCardNumberValid: false,
};

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function PaymentContent() {
  const [activeMethod, setActiveMethod] = useState<PaymentMethod | null>(null);
  const [cardInfo, setCardInfo] = useState<CardInformation>(INITIAL_CARD);
  const [cardErrors, setCardErrors] = useState<CardFormErrors>({});
  const [cashDate, setCashDate] = useState<Date | null>(null);
  const [cashErrors, setCashErrors] = useState<CashPaymentErrors>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<{ message: string; title?: string } | null>(null);
  const errorState = useOverlayState({
    isOpen: paymentError !== null,
    onOpenChange: (open) => {
      if (!open) setPaymentError(null);
    },
  });
  const router = useRouter();

  const { profile } = useUser();
  const { tenancy, currentPayment, loading: tenancyLoading, error: tenancyError, refetch } = useTenancy();
  const paymentsQuery = usePayments(tenancy?.id ?? null);

  const apartment = tenancy?.apartment ?? null;
  const landlord = tenancy?.landlord ?? null;
  const monthlyRent = tenancy?.monthly_rent ?? apartment?.monthly_rent ?? 0;

  // Pending maintenance fees ride on top of this period's rent.
  const [pendingFees, setPendingFees] = useState<{ title: string; amount: number }[]>([]);
  const apartmentIdForFees = apartment?.id ?? null;
  useEffect(() => {
    if (!apartmentIdForFees) return;
    const apartmentId = apartmentIdForFees;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      void (async () => {
        try {
          const { getTenantContext } = await import("@/service/favoritesService");
          const context = await getTenantContext();
          if (!context.tenantId || cancelled) return;
          const { fetchPendingMaintenanceFees } = await import("@/service/maintenanceService");
          const fees = await fetchPendingMaintenanceFees(apartmentId, context.tenantId);
          if (!cancelled) setPendingFees(fees);
        } catch {
          // Additive info only — a failed lookup must not block payment.
        }
      })();
    });
    return () => {
      cancelled = true;
    };
  }, [apartmentIdForFees]);

  const feesTotal = pendingFees.reduce((sum, fee) => sum + fee.amount, 0);
  const totalDue = monthlyRent + feesTotal;

  const period = useMemo(
    () =>
      resolvePaymentPeriod(
        currentPayment?.period_start ?? null,
        currentPayment?.period_end ?? null,
        currentPayment?.due_date ?? null,
      ),
    [currentPayment?.period_start, currentPayment?.period_end, currentPayment?.due_date],
  );
  const monthLabel = periodMonthLabel(period.dueDate ?? period.periodStart);
  const yearLabel = period.periodStart.slice(0, 4);

  // Full-amount policy: rent + pending fees are always billed whole. A fully
  // paid period cannot be paid again (prevents double-payment/overpay).
  const isPeriodPaid =
    totalDue > 0 && paidAmountForPeriod(paymentsQuery.data ?? [], period.periodStart) >= totalDue;

  const landlordName =
    landlord?.first_name || landlord?.last_name
      ? `${landlord?.first_name ?? ""} ${landlord?.last_name ?? ""}`.trim()
      : "—";
  const address = apartment
    ? [apartment.street_address, apartment.barangay, apartment.city, apartment.province].filter(Boolean).join(", ")
    : "—";

  const handlePay = async () => {
    if (isProcessing || isPeriodPaid) return;
    if (!activeMethod) {
      setPaymentError({ message: "Please select a payment method before proceeding.", title: "No Payment Method" });
      return;
    }
    if (!tenancy || !apartment) {
      setPaymentError({ message: "No active rental found on this account.", title: "No Active Rental" });
      return;
    }

    const referenceId = `pay_${Date.now().toString(36)}`;
    const paymentDescription =
      feesTotal > 0
        ? `Rent payment for ${monthLabel} ${yearLabel} - ${apartment.name} (incl. maintenance fees)`
        : `Rent payment for ${monthLabel} ${yearLabel} - ${apartment.name}`;
    const amount = totalDue;
    const periodFields = {
      tenancyId: tenancy.id,
      periodStart: period.periodStart,
      periodEnd: period.periodEnd,
      dueDate: period.dueDate,
    };

    if (activeMethod === "GCash" || activeMethod === "Maya" || activeMethod === "QRPh") {
      setIsProcessing(true);
      try {
        const methodMap: Record<string, "gcash" | "maya" | "qrph"> = {
          GCash: "gcash",
          Maya: "maya",
          QRPh: "qrph",
        };
        const session = await createCheckoutSession({
          referenceId,
          amount,
          description: paymentDescription,
          redirectBaseUrl: `${window.location.origin}/tenant/payment/verify`,
          method: methodMap[activeMethod],
          ...periodFields,
        });
        window.location.href = session.checkoutUrl;
      } catch (error) {
        setPaymentError({
          message: error instanceof PaymongoError ? error.reason : "Unable to start your payment. Please try again.",
        });
      } finally {
        setIsProcessing(false);
      }
    } else if (activeMethod === "Debit/Credit-Card") {
      const errs = validateCardInfo(cardInfo);
      if (Object.keys(errs).length > 0) {
        setCardErrors(errs);
        return;
      }
      const [expMonth, expYear] = cardInfo.expiryDate.split("/");
      setIsProcessing(true);
      try {
        const result = await createCardPayment({
          referenceId,
          amount,
          description: paymentDescription,
          card: {
            number: cardInfo.cardNumber.replace(/\s/g, ""),
            expMonth: Number(expMonth),
            expYear: Number(`20${expYear}`),
            cvc: cardInfo.cvv,
            name: cardInfo.cardholderName,
          },
          ...periodFields,
        });
        if (result.status === "succeeded") {
          router.push(`/tenant/payment/success?referenceId=${referenceId}`);
        } else {
          setPaymentError({ message: result.failureReason ?? "Your payment could not be completed." });
        }
      } catch (error) {
        setPaymentError({
          message: error instanceof PaymongoError ? error.reason : "Payment failed. Please try again.",
        });
      } finally {
        setIsProcessing(false);
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
      }
    }
  };

  if (tenancyLoading || paymentsQuery.loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center px-5">
        <Spinner size="lg" color="current" className="text-primary" />
        <p className="text-zinc-500 mt-4 text-base font-inter text-center">Loading payment…</p>
      </div>
    );
  }

  if (tenancyError || !tenancy || !apartment) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-4">
          <Button variant="outline" size="sm" onPress={() => router.back()} className="w-fit">
            <ArrowLeft size={16} /> Back
          </Button>
          <Card className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-sm">
            <Card.Content className="py-16 flex flex-col items-center gap-4 text-center px-6">
              <p className="text-lg font-nunito font-semibold text-zinc-900 dark:text-zinc-100">
                {tenancyError ?? "No active rental found on this account."}
              </p>
              <Button onPress={() => void refetch()} className="rounded-full font-nunito">
                Try Again
              </Button>
            </Card.Content>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <Button variant="outline" size="sm" onPress={() => router.back()} className="w-fit">
            <ArrowLeft size={16} /> Back
          </Button>
          <p className="text-xs text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <Banknote size={14} className="text-primary" /> Rent Payment
          </p>
          <div>
            <h1 className="text-2xl sm:text-3xl font-nunito font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Rent Payment</h1>
            <p className="text-sm text-zinc-500 mt-1">Review your lease, choose a method, and pay.</p>
          </div>
        </div>

        {/* Non-blocking paid notice — page stays interactive, Pay grays out below */}
        {isPeriodPaid && (
          <Card className="rounded-2xl border border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-950/30">
            <Card.Content className="p-4 flex flex-row items-center gap-3">
              <span className="rounded-full bg-green-600 p-2 text-white shrink-0">
                <CheckCircle2 size={18} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-nunito font-semibold text-green-800 dark:text-green-200">Rent already paid</p>
                <p className="text-xs text-green-700/80 dark:text-green-300/80">
                  Your rent for {monthLabel} {yearLabel} has been paid in full. No further payment is needed.
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

        {/* Main grid — row 1 top cards share equal height via items-stretch */}
        <div className="grid gap-4 lg:grid-cols-3 items-stretch">
          {/* Row 1, left: lease details */}
          <div className="lg:col-span-2 h-full">
            {/* Apartment / lease card */}
            <Card className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-sm h-full flex flex-col">
              <Card.Header className="px-4 pt-4 pb-2">
                <h3 className="text-base font-nunito font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <House size={18} className="text-primary" /> {apartment.name}
                </h3>
                <p className="text-sm text-zinc-500 flex items-center gap-1 mt-1">
                  <MapPin size={14} /> {address}
                </p>
              </Card.Header>
              <Card.Content className="px-4 pb-4 flex-1 flex flex-col">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 p-3">
                    <span className="rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-2">
                      <User size={16} className="text-zinc-500" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs text-zinc-500">Landlord</p>
                      <p className="text-base font-nunito font-medium text-zinc-900 dark:text-zinc-100 truncate">{landlordName}</p>
                      <p className="text-sm text-zinc-500 truncate">{landlord?.email ?? "—"}</p>
                    </div>
                    <Avatar size="sm" className="ml-auto hidden sm:flex">
                      <Avatar.Fallback className="bg-primary text-white text-xs">
                        {(landlord?.first_name?.[0] ?? "—")}
                        {(landlord?.last_name?.[0] ?? "")}
                      </Avatar.Fallback>
                    </Avatar>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3">
                      <p className="text-xs uppercase tracking-wider text-zinc-400">Lease Start</p>
                      <p className="text-base font-nunito font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 mt-1">
                        <CalendarDays size={16} className="text-zinc-400" /> {formatLeaseDate(tenancy.lease_start)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3">
                      <p className="text-xs uppercase tracking-wider text-zinc-400">Lease End</p>
                      <p className="text-base font-nunito font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 mt-1">
                        <CalendarDays size={16} className="text-zinc-400" /> {formatLeaseDate(tenancy.lease_end)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 mt-auto pt-3">
                  <Chip size="sm" variant="soft" color="success">
                    Active lease
                  </Chip>
                  <Chip size="sm" variant="soft" color="default">
                    {apartment.city}
                  </Chip>
                  <Chip size="sm" variant="soft" color="default">
                    {formatPesoDisplay(monthlyRent)} / month
                  </Chip>
                </div>
              </Card.Content>
            </Card>
          </div>

          {/* Row 1, right: payment summary (display-only, mobile parity) */}
          <div className="h-full">
            <PaymentSummaryCard month={monthLabel} year={yearLabel} dueDate={period.dueDate} monthlyRent={monthlyRent} fees={pendingFees} className="h-full" />
          </div>

          {/* Row 2: payment method (full width) */}
          <div className="lg:col-span-3 space-y-4">
            <PaymentMethodSelector
              onPaymentMethodChange={(method) => {
                setActiveMethod(method);
                setPaymentError(null);
              }}
              cardInformation={cardInfo}
              onCardInformationChange={(patch) => {
                setCardInfo((p) => ({ ...p, ...patch }));
                setCardErrors({});
              }}
              cardErrors={cardErrors}
              cashPaymentDate={cashDate}
              onCashPaymentDateChange={(d) => {
                setCashDate(d);
                setCashErrors({});
              }}
              cashErrors={cashErrors}
            />
          </div>
        </div>

        {/* Pay footer — in-flow sticky (never overlays inputs, mobile footer parity) */}
        <div className="sticky bottom-4 z-20 mt-4">
          <PaymentFooter totalPayment={totalDue} onPayPress={() => void handlePay()} isProcessing={isProcessing} isDisabled={isPeriodPaid} />
        </div>
      </div>

      {/* Error dialog (mobile ErrorDialog parity, HeroUI Modal) */}
      <Modal.Root state={errorState}>
        <Modal.Backdrop>
          <Modal.Container placement="center" size="sm">
            <Modal.Dialog className="rounded-2xl">
              <Modal.Header className="text-base font-nunito font-semibold">
                {paymentError?.title ?? "Payment Failed"}
              </Modal.Header>
              <Modal.Body>
                <p className="text-sm text-zinc-600 dark:text-zinc-300">{paymentError?.message ?? ""}</p>
              </Modal.Body>
              <Modal.Footer className="flex justify-end">
                <Button variant="secondary" size="sm" onPress={() => setPaymentError(null)} className="rounded-full font-nunito">
                  Dismiss
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal.Root>
    </div>
  );
}

export default function TenantPaymentPage() {
  return <PaymentContent />;
}
