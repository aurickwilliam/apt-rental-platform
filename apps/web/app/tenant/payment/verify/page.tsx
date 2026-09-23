"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Spinner } from "@heroui/react";
import { getCheckoutSessionStatus, PaymongoError } from "@/service/paymongoService";

// Web twin of mobile verify.tsx: hosted-checkout return landing on primary blue.
// Trusts only getCheckoutSessionStatus(sessionId) — URL params never decide.
function VerifyContent() {
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = params.get("sessionId");
  const referenceId = params.get("referenceId");

  const [isVerifying, setIsVerifying] = useState(() => !!sessionId);
  const [errorMessage, setErrorMessage] = useState<string | null>(() =>
    sessionId ? null : "Missing payment session. Please start a new payment.",
  );
  const verifyingRef = useRef(false);

  const verifyPayment = useCallback(
    async (sessionIdValue: string) => {
      if (verifyingRef.current) return;
      verifyingRef.current = true;
      setIsVerifying(true);
      setErrorMessage(null);
      try {
        const status = await getCheckoutSessionStatus(sessionIdValue);
        if (status === "paid") {
          const ref = referenceId || sessionIdValue.replace(/^cs_/, "");
          router.replace(`/tenant/payment/success?referenceId=${ref}`);
          return;
        }
        if (status === "failed") {
          setErrorMessage("Your payment was declined or cancelled. Please try again.");
        } else if (status === "expired") {
          setErrorMessage("This payment session has expired. Please start a new payment.");
        } else {
          setErrorMessage("We could not confirm your payment yet. Please try again.");
        }
      } catch (error) {
        setErrorMessage(error instanceof PaymongoError ? error.reason : "We could not confirm your payment. Please try again.");
      } finally {
        verifyingRef.current = false;
        setIsVerifying(false);
      }
    },
    [router, referenceId],
  );

  useEffect(() => {
    if (typeof sessionId === "string" && sessionId.length > 0) {
      const pendingId = sessionId;
      queueMicrotask(() => {
        void verifyPayment(pendingId);
      });
    } else if (!sessionId) {
      queueMicrotask(() => {
        setIsVerifying(false);
        setErrorMessage("Missing payment session. Please start a new payment.");
      });
    }
  }, [sessionId, verifyPayment]);

  const handleRetry = () => {
    if (typeof sessionId === "string" && sessionId.length > 0) void verifyPayment(sessionId);
  };

  const handleGoBack = () => {
    router.replace("/tenant/payment");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10 text-center" style={{ backgroundColor: "#376BF5" }}>
      {isVerifying ? (
        <>
          <Spinner size="lg" color="current" className="text-white" />
          <p className="text-white mt-4 text-base font-inter">Verifying payment…</p>
        </>
      ) : errorMessage ? (
        <div className="flex flex-col items-center gap-4 max-w-sm">
          <p className="text-white text-base font-inter">{errorMessage}</p>
          <div className="flex flex-row gap-3">
            <Button size="sm" onPress={handleRetry} className="rounded-full font-nunito bg-white text-primary">
              Try Again
            </Button>
            <Button
              size="sm"
              onPress={handleGoBack}
              className="rounded-full font-nunito bg-transparent border border-white text-white"
            >
              Go Back
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function TenantPaymentVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center px-5" style={{ backgroundColor: "#376BF5" }}>
          <Spinner size="lg" color="current" className="text-white" />
          <p className="text-white mt-4 text-base font-inter">Verifying payment…</p>
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
