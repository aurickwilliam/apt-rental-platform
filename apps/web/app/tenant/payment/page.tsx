"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, Button, Card, Chip, Separator, Modal, useOverlayState } from "@heroui/react";
import { Banknote, CalendarDays, House, MapPin, User, ArrowRight, CheckCircle2, AlertTriangle } from "lucide-react";
import { formatPesoDisplay } from "@repo/utils";
import { validateCardInfo, type CardFormErrors } from "@repo/utils";
import { MOCK_PAYMENTS, MOCK_TENANCY, mockSessionIdForReference } from "./constants";
import type { CardInformation, PaymentMethod } from "./types";
import { formatLeaseDate, periodMonthLabel } from "./utils";
import PaymentSummaryCard from "./components/PaymentSummaryCard";
import PaymentMethodSelector from "./components/PaymentMethodSelector";
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

export default function TenantPaymentPage() {
  const [activeMethod, setActiveMethod] = useState<PaymentMethod | null>(null);
  const [cardInfo, setCardInfo] = useState<CardInformation>(INITIAL_CARD);
  const [cardErrors, setCardErrors] = useState<CardFormErrors>({});
  const [cashDate, setCashDate] = useState<Date | null>(null);
  const [cashErrors, setCashErrors] = useState<CashPaymentErrors>({});
  const [isProcessing, setIsProcessing] = useState(false);
  // Confirm dialog only — one overlay state object, so veil + dialog +
  // scroll-lock can't desync. Success renders on its own route (mobile parity).
  const [showConfirm, setShowConfirm] = useState(false);
  const confirmState = useOverlayState({ isOpen: showConfirm, onOpenChange: setShowConfirm });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  const tenancy = MOCK_TENANCY;
  const apartment = tenancy.apartment;
  const landlord = tenancy.landlord;
  const period = tenancy.currentPeriod;
  const monthLabel = periodMonthLabel(period.due_date);
  const yearLabel = period.period_start.slice(0, 4);
  const monthlyRent = tenancy.monthly_rent;

  // mock "already paid" guard — same as mobile paidAmountForPeriod check
  const isPeriodPaid = useMemo(() => {
    const paid = MOCK_PAYMENTS.filter((p) => p.period_start === period.period_start && p.status === "Paid").length > 0;
    return paid;
  }, [period.period_start]);

  const landlordName = `${landlord.first_name} ${landlord.last_name}`.trim();
  const address = [apartment.street_address, apartment.barangay, apartment.city, apartment.province].filter(Boolean).join(", ");

  const handlePayClick = () => {
    if (!activeMethod) {
      setErrorMsg("Please select a payment method before proceeding.");
      return;
    }
    if (activeMethod === "Debit/Credit-Card") {
      const errs = validateCardInfo(cardInfo);
      if (Object.keys(errs).length > 0) {
        setCardErrors(errs);
        return;
      }
    }
    if (activeMethod === "Cash") {
      const errs = validateCashPayment({ paymentDate: cashDate });
      if (Object.keys(errs).length > 0) {
        setCashErrors(errs);
        return;
      }
    }
    setShowConfirm(true);
  };

  const handleConfirmPay = () => {
    if (!activeMethod) {
      setShowConfirm(false);
      return;
    }
    // Mobile parity: referenceId per tap + period context for the record.
    const referenceId = `pay_${Date.now().toString(36)}`;
    const method = activeMethod;
    setIsProcessing(true);
    setShowConfirm(false);
    // TODO(backend): e-wallets → createCheckoutSession (paymongo edge fn) then
    // redirect to checkout_url; card → createCardPayment; cash → createCashPayment
    // (pending). UI-only routing below mirrors the mobile destinations.
    setTimeout(() => {
      setIsProcessing(false);
      if (method === "GCash" || method === "Maya" || method === "QRPh") {
        router.push(
          `/tenant/payment/verify?sessionId=${mockSessionIdForReference(referenceId)}&referenceId=${referenceId}`,
        );
      } else {
        router.push(`/tenant/payment/success?referenceId=${referenceId}&method=${encodeURIComponent(method)}`);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <Link href="/tenant/my-rental" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-700 w-fit">
            <ArrowRight size={12} className="rotate-180" /> Back to My Rental
          </Link>
          <p className="text-xs text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <Banknote size={14} className="text-primary" /> Rent Payment
          </p>
          <div>
            <h1 className="text-2xl sm:text-3xl font-nunito font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Rent Payment</h1>
            <p className="text-sm text-zinc-500 mt-1">Review your lease, choose a method, and pay — no backend required in this preview.</p>
          </div>
        </div>

        {/* Already-paid banner */}
        {isPeriodPaid && (
          <Card className="rounded-2xl border border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-950/30">
            <Card.Content className="p-4 flex flex-row items-center gap-3">
              <span className="rounded-full bg-green-600 p-2 text-white">
                <CheckCircle2 size={18} />
              </span>
              <div className="flex-1">
                <p className="text-sm font-nunito font-semibold text-green-800 dark:text-green-200">Rent already paid</p>
                <p className="text-xs text-green-700/80 dark:text-green-300/80">
                  Your rent for {monthLabel} {yearLabel} has been paid in full. No further payment is needed.
                </p>
              </div>
              <Link href="/tenant/payment/history" className="no-underline">
                <Button size="sm" variant="ghost" className="text-green-700">
                  View receipt <ArrowRight size={14} />
                </Button>
              </Link>
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
                      <p className="text-sm text-zinc-500 truncate">{landlord.email}</p>
                    </div>
                    <Avatar size="sm" className="ml-auto hidden sm:flex">
                      <Avatar.Fallback className="bg-primary text-white text-xs">
                        {landlord.first_name[0]}
                        {landlord.last_name[0]}
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

          {/* Row 1, right: payment summary (matches Details height, Pay inside) */}
          <div className="h-full">
            <PaymentSummaryCard
              month={monthLabel}
              year={yearLabel}
              dueDate={period.due_date}
              monthlyRent={monthlyRent}
              className="h-full"
              onPayPress={handlePayClick}
              isProcessing={isProcessing}
              isDisabled={isProcessing || isPeriodPaid}
              activeMethod={activeMethod}
            />
          </div>

          {/* Row 2: payment method (full width) */}
          <div className="lg:col-span-3 space-y-4">
            {/* Payment method selector */}
            <PaymentMethodSelector
              onPaymentMethodChange={(method) => { setActiveMethod(method); setErrorMsg(null); }}
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

            {/* Error inline */}
            {errorMsg && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900/50 p-3 text-sm text-amber-800 dark:text-amber-200">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <span>{errorMsg}</span>
                <Button size="sm" variant="ghost" className="ml-auto text-amber-700" onPress={() => setErrorMsg(null)}>
                  Dismiss
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirm dialog — success renders on its own route (mobile parity) */}
      <Modal.Root state={confirmState}>
        <Modal.Backdrop>
          <Modal.Container placement="center" size="sm">
            <Modal.Dialog className="rounded-2xl">
              <Modal.Header className="text-base font-nunito font-semibold">Confirm payment</Modal.Header>
              <Modal.Body className="space-y-3">
                <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Billing period</span>
                    <span className="font-nunito font-medium text-zinc-900 dark:text-zinc-100">
                      {monthLabel} {yearLabel}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Due date</span>
                    <span className="font-nunito font-medium text-zinc-900 dark:text-zinc-100">{period.due_date}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Method</span>
                    <span className="font-nunito font-medium text-zinc-900 dark:text-zinc-100">{activeMethod ?? "—"}</span>
                  </div>
                  <Separator className="my-1" />
                  <div className="flex justify-between text-sm font-nunito font-semibold">
                    <span>Total</span>
                    <span className="text-primary">{formatPesoDisplay(monthlyRent)}</span>
                  </div>
                </div>
                <p className="text-xs text-zinc-500">
                  This is a UI preview — no real charge will be made. Payment for {monthLabel} {yearLabel}.
                </p>
              </Modal.Body>
              <Modal.Footer className="gap-2">
                <Button variant="secondary" onPress={() => setShowConfirm(false)}>
                  Cancel
                </Button>
                <Button onPress={handleConfirmPay}>Confirm & pay {formatPesoDisplay(monthlyRent)}</Button>
              </Modal.Footer>
              <Modal.CloseTrigger />
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal.Root>
    </div>
  );
}



