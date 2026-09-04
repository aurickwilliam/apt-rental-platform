"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card, Spinner } from "@heroui/react";
import { ArrowLeft, Banknote } from "lucide-react";
import { mockPaymentByReference } from "../constants";
import type { PaymentRecord } from "../types";
import ReceiptView from "../components/ReceiptView";

// UI-only mirror of mobile success.tsx: receipt for a fresh payment.
// Mobile polls every 3s while status is pending (except cash, which shows
// Pending immediately); here a short simulated confirmation stands in.
// TODO(backend): resolve via fetchPaymentByReference + poll while pending.
function SuccessContent() {
  const router = useRouter();
  const params = useSearchParams();
  const referenceId = params.get("referenceId");
  const method = params.get("method");

  // Resolved synchronously (mock lookup is pure); only the simulated
  // "confirming" wait uses an effect, and it only ever sets a timer.
  const found = useMemo(
    () => mockPaymentByReference(referenceId, method),
    [referenceId, method],
  );
  const needsConfirming = useMemo(() => {
    if (!found) return false;
    // Mobile parity: cash Pending (and terminal Failed/Unpaid) render at once.
    return (
      String(found.method).toLowerCase() !== "cash" &&
      found.status !== "Failed" &&
      found.status !== "Unpaid"
    );
  }, [found]);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!needsConfirming) return;
    const timer = setTimeout(() => setConfirmed(true), 1500);
    return () => clearTimeout(timer);
  }, [needsConfirming]);

  const payment: PaymentRecord | null = !found
    ? null
    : needsConfirming
      ? confirmed
        ? { ...found, status: "Paid" }
        : null
      : found;
  const isConfirming = needsConfirming && !confirmed;

  if (!isConfirming && !payment) {
    return (
      <div className="min-h-screen bg-primary flex flex-col">
        <div className="max-w-3xl mx-auto w-full px-4 py-6 flex-1 flex flex-col">
          <Button variant="ghost" isIconOnly className="bg-white/20 self-start text-white" onPress={() => router.back()} aria-label="Back">
            <ArrowLeft size={20} className="text-white" />
          </Button>
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center py-16">
            <p className="text-white text-lg font-nunito font-semibold">We could not find this payment.</p>
            <p className="text-white/70 text-sm font-inter">The receipt ID may be incorrect or the mock record was removed.</p>
            <div className="flex gap-2">
              <Link href="/tenant/payment/history" className="no-underline">
                <Button className="bg-white text-primary rounded-full font-nunito">Back to history</Button>
              </Link>
              <Link href="/tenant/payment" className="no-underline">
                <Button variant="ghost" className="bg-white/20 text-white rounded-full font-nunito">
                  Go to payment
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary">
      <div className="max-w-3xl mx-auto w-full px-4 py-4 sm:py-6 flex flex-col min-h-screen">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            isIconOnly
            className="bg-white/20 text-white hover:bg-white/30"
            onPress={() => router.back()}
            aria-label="Back"
          >
            <ArrowLeft size={20} className="text-white" />
          </Button>
          <Link href="/tenant/payment/history" className="no-underline">
            <Button variant="ghost" className="bg-white/20 text-white hover:bg-white/30 rounded-full text-xs font-nunito">
              History
            </Button>
          </Link>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center py-6 sm:py-10 gap-6">
          {isConfirming || !payment ? (
            <div className="flex flex-col items-center gap-4 py-16">
              <Spinner size="lg" color="current" className="text-white" />
              <p className="text-white text-base font-inter text-center">
                Confirming your payment…
              </p>
            </div>
          ) : (
            <>
              <ReceiptView payment={payment} />

              <Card className="w-full max-w-[560px] rounded-2xl border border-white/20 bg-white/10 backdrop-blur">
                <Card.Content className="p-4 flex flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-white/90">
                    <Banknote size={16} />
                    <span className="text-sm font-nunito font-medium">Need help with this payment?</span>
                  </div>
                  <Link href="/tenant/messages" className="no-underline">
                    <Button size="sm" className="bg-white text-primary rounded-full font-nunito">
                      Contact landlord
                    </Button>
                  </Link>
                </Card.Content>
              </Card>
            </>
          )}
        </div>

        <div className="pb-2 flex justify-center">
          <Link href="/tenant/payment" className="no-underline">
            <Button className="bg-white text-primary rounded-full font-nunito">Back to payment</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function TenantPaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-primary flex flex-col items-center justify-center px-5">
          <Spinner size="lg" color="current" className="text-white" />
          <p className="text-white mt-4 text-base font-inter text-center">Loading your receipt…</p>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}

