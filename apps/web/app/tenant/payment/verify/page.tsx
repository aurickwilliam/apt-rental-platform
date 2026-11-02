"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@heroui/react";
import PaymentStatusLoading from "../components/PaymentStatusLoading";
import { cancelCheckoutSession, getCheckoutSessionDetails, PaymongoError } from "@/service/paymongoService";

// Web twin of mobile verify.tsx: hosted-checkout return landing on primary blue.
// Trusts only getCheckoutSessionStatus(sessionId) — URL params never decide.
function VerifyContent() {
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = params.get("sessionId");
  const referenceId = params.get("referenceId");
  // Set by the checkout's cancel link (the back arrow). Only picks the screen:
  // the backend still decides what happened to the payment.
  const backedOut = params.get("cancelled") === "1";

  const [isVerifying, setIsVerifying] = useState(() => !!sessionId);
  const [errorMessage, setErrorMessage] = useState<string | null>(() =>
    sessionId ? null : "Missing payment session. Please start a new payment.",
  );
  const [isCancelled, setIsCancelled] = useState(false);
  const verifyingRef = useRef(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  const verifyPayment = useCallback(
    async (sessionIdValue: string) => {
      if (verifyingRef.current) return;
      verifyingRef.current = true;
      setIsVerifying(true);
      setErrorMessage(null);
      try {
        const details = backedOut
          ? { status: await cancelCheckoutSession(sessionIdValue), checkoutUrl: null }
          : await getCheckoutSessionDetails(sessionIdValue);
        const { status } = details;
        setCheckoutUrl(details.checkoutUrl);
        if (status === "paid") {
          const ref = referenceId || sessionIdValue.replace(/^cs_/, "");
          router.replace(`/tenant/payment/success?referenceId=${ref}`);
          return;
        }
        if (backedOut && (status === "failed" || status === "expired")) {
          setIsCancelled(true);
        } else if (status === "failed") {
          setErrorMessage("Your payment was declined or cancelled. Please try again.");
        } else if (status === "expired") {
          setErrorMessage("This payment session has expired. Please start a new payment.");
        } else {
          setErrorMessage("Your payment is still awaiting confirmation. Continue the existing checkout or check its status again; do not start another payment.");
        }
      } catch (error) {
        setErrorMessage(error instanceof PaymongoError ? error.reason : "We could not confirm your payment. Please try again.");
      } finally {
        verifyingRef.current = false;
        setIsVerifying(false);
      }
    },
    [router, referenceId, backedOut],
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

  if (isVerifying) return <PaymentStatusLoading message="Verifying payment…" />;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10 text-center" style={{ backgroundColor: "#376BF5" }}>
      {isCancelled ? (
        <div className="flex flex-col items-center gap-4 max-w-sm">
          <p className="text-white text-lg font-nunito font-semibold">Payment cancelled</p>
          <p className="text-white text-base font-inter">You were not charged. You can pay again whenever you are ready.</p>
          <Button size="sm" onPress={handleGoBack} className="rounded-full font-nunito bg-white text-primary">
            Back to payment
          </Button>
        </div>
      ) : errorMessage ? (
        <div className="flex flex-col items-center gap-4 max-w-sm">
          <p className="text-white text-base font-inter">{errorMessage}</p>
          {checkoutUrl && <Button onPress={() => { window.location.href = checkoutUrl; }} className="bg-white text-primary">Continue checkout</Button>}
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
      fallback={<PaymentStatusLoading message="Verifying payment…" />}
    >
      <VerifyContent />
    </Suspense>
  );
}
