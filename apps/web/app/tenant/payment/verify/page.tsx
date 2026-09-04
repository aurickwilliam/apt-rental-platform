"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Spinner } from "@heroui/react";
import { mockReferenceFromSession, mockSessionStatus } from "../constants";

// UI-only mirror of mobile verify.tsx: the hosted-checkout return landing.
// Mobile trusts only getCheckoutSessionStatus(sessionId); here the mock
// session id suffix drives the simulated outcome (-fail / -expired).
// TODO(backend): replace the setTimeout with getCheckoutSessionStatus
// via the paymongo edge function + webhook-driven pending→paid flip.
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
  const cleanupRef = useRef<(() => void) | null>(null);

  // Starts the simulated status check; state updates happen in the timer
  // callback (never synchronously in an effect body).
  const checkSession = useCallback(
    (sessionIdValue: string) => {
      if (verifyingRef.current) return () => {};
      verifyingRef.current = true;
      const timer = setTimeout(() => {
        const status = mockSessionStatus(sessionIdValue);

        if (status === "paid") {
          const ref = referenceId || mockReferenceFromSession(sessionIdValue);
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
        setIsVerifying(false);
        verifyingRef.current = false;
      }, 900);

      return () => {
        verifyingRef.current = false;
        clearTimeout(timer);
      };
    },
    [router, referenceId],
  );

  useEffect(() => {
    if (!sessionId) return;
    cleanupRef.current = checkSession(sessionId);
    return () => cleanupRef.current?.();
  }, [sessionId, checkSession]);

  useEffect(() => () => cleanupRef.current?.(), []);

  const handleRetry = () => {
    if (!sessionId) return;
    cleanupRef.current?.();
    setIsVerifying(true);
    setErrorMessage(null);
    cleanupRef.current = checkSession(sessionId);
  };

  const handleGoBack = () => {
    router.replace("/tenant/payment");
  };

  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-center px-5 py-10 text-center">
      {isVerifying ? (
        <>
          <Spinner size="lg" color="current" className="text-white" />
          <p className="text-white mt-4 text-base font-inter">Verifying payment…</p>
        </>
      ) : errorMessage ? (
        <div className="flex flex-col items-center gap-4 max-w-sm">
          <p className="text-white text-base font-inter">{errorMessage}</p>
          <div className="flex flex-row gap-3">
            <Button variant="secondary" size="sm" onPress={handleRetry} className="bg-white">
              Try Again
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onPress={handleGoBack}
              className="border border-white text-white"
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
        <div className="min-h-screen bg-primary flex flex-col items-center justify-center px-5">
          <Spinner size="lg" color="current" className="text-white" />
          <p className="text-white mt-4 text-base font-inter">Verifying payment…</p>
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}

