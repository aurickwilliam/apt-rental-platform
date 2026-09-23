"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Spinner } from "@heroui/react";
import { usePaymentByReference } from "@/hooks/use-payments";
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
