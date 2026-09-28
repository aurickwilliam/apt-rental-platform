"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Spinner } from "@heroui/react";
import { usePaymentByReference } from "@/hooks/use-payments";
import { useTenancy } from "@/hooks/use-tenancy";
import { useUser } from "@/hooks/use-user";
import ReceiptView from "../components/ReceiptView";

// Web twin of mobile success.tsx: dedicated blue receipt route.
// Polls while pending non-cash (webhook flips pending→paid); cash stays
// pending until landlord confirms.
function SuccessContent() {
  const router = useRouter();
  const params = useSearchParams();
  const rawReferenceId = params.get("referenceId");
  const referenceId = Array.isArray(rawReferenceId) ? rawReferenceId[0] : (rawReferenceId ?? null);

  const paymentQuery = usePaymentByReference(referenceId, { pollWhilePending: true });
  const payment = paymentQuery.data;

  const isLoading = paymentQuery.loading || (payment?.status === "pending" && payment.method !== "cash");

  // Once this period's payment is confirmed paid, settle any maintenance fees
  // raised before it (they ride on this rent). Once per reference. Cash moves
  // through this same path when the landlord flips it to paid.
  const { tenancy } = useTenancy();
  const { profile } = useUser();
  const settledRef = useRef<string | null>(null);
  useEffect(() => {
    if (!payment || payment.status !== "paid" || !referenceId) return;
    if (settledRef.current === referenceId) return;
    const apartmentId = tenancy?.apartment.id;
    const tenantId = profile?.id;
    if (!apartmentId || !tenantId) return;
    settledRef.current = referenceId;
    queueMicrotask(() => {
      void (async () => {
        try {
          const { settleMaintenanceFees } = await import("@/service/maintenanceService");
          await settleMaintenanceFees(apartmentId, tenantId, payment.created_at);
        } catch {
          // Display-only concern — a failed settle must not break the receipt.
          // Fees stay pending and settle on the next paid observation.
          settledRef.current = null;
        }
      })();
    });
  }, [payment, referenceId, tenancy?.apartment.id, profile?.id]);

  const handleGoHome = () => {
    router.replace("/tenant/my-rental");
  };

  const handleViewHistory = () => {
    router.push("/tenant/payment/history");
  };

  const handleRetry = () => {
    void paymentQuery.refetch();
  };

  if (paymentQuery.error) {
    return (
      <div className="min-h-screen px-5 flex flex-col" style={{ backgroundColor: "#376BF5" }}>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
          <p className="text-white text-lg font-nunito font-semibold">We could not load your payment details.</p>
          <p className="text-white/70 text-xs font-inter break-all">{paymentQuery.error}</p>
          <Button onPress={handleRetry} className="bg-white text-primary rounded-full font-nunito">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen px-5 flex flex-col" style={{ backgroundColor: "#376BF5" }}>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
          <Spinner size="lg" color="current" className="text-white" />
          <p className="text-white text-base font-inter">{payment ? "Confirming your payment…" : "Loading your receipt…"}</p>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen px-5 flex flex-col" style={{ backgroundColor: "#376BF5" }}>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
          <p className="text-white text-lg font-nunito font-semibold">We could not find this payment.</p>
          <Button onPress={handleGoHome} className="bg-white text-primary rounded-full font-nunito">
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 sm:px-5 py-8 flex flex-col" style={{ backgroundColor: "#376BF5" }}>
      <div className="flex-1 flex flex-col items-center justify-center gap-4 w-full max-w-xl mx-auto">
        <ReceiptView payment={payment} />
        <div className="flex flex-wrap items-center justify-center gap-2 w-full">
          <Button onPress={handleGoHome} className="bg-white text-primary rounded-full font-nunito">
            Go to Home
          </Button>
          <Button onPress={handleViewHistory} className="rounded-full font-nunito bg-transparent border border-white text-white">
            View history
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function TenantPaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center px-5" style={{ backgroundColor: "#376BF5" }}>
          <Spinner size="lg" color="current" className="text-white" />
          <p className="text-white mt-4 text-base font-inter text-center">Loading your receipt…</p>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
