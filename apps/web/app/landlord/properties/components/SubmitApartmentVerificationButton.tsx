"use client";

import { useState, useTransition } from "react";
import { Button, Chip } from "@heroui/react";
import { submitApartmentVerification } from "../actions/submit-verification";

interface SubmitApartmentVerificationButtonProps {
  apartmentId: string;
  status: string | null;
  rejectionReason?: string | null;
}

export function SubmitApartmentVerificationButton({
  apartmentId,
  status,
  rejectionReason,
}: SubmitApartmentVerificationButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(status === "pending");
  const currentStatus = submitted ? "pending" : status;

  if (currentStatus === "approved") {
    return <Chip variant="soft" color="success">Verified</Chip>;
  }

  if (currentStatus === "pending") {
    return <Chip variant="soft" color="warning">Verification pending</Chip>;
  }

  return (
    <div className="space-y-1">
      {currentStatus === "rejected" ? (
        <p className="text-xs text-danger">Rejected: {rejectionReason || "Please update the listing and resubmit."}</p>
      ) : null}
      <Button
        variant="outline"
        size="sm"
        isPending={isPending}
        onPress={() => startTransition(async () => {
          const result = await submitApartmentVerification(apartmentId);
          if (result.error) {
            setMessage(result.error);
            return;
          }
          setSubmitted(true);
          setMessage("Submitted for verification.");
        })}
      >
        {currentStatus === "rejected" ? "Resubmit for verification" : "Request verification"}
      </Button>
      {message ? <p role="status" aria-live="polite" className="text-xs text-muted-foreground">{message}</p> : null}
    </div>
  );
}
