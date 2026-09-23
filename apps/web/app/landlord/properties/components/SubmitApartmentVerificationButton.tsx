"use client";

import { useState, useTransition } from "react";
import { Button } from "@heroui/react";
import { submitApartmentVerification } from "../actions/submit-verification";

interface SubmitApartmentVerificationButtonProps { apartmentId: string }
export function SubmitApartmentVerificationButton({ apartmentId }: SubmitApartmentVerificationButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  return <div className="space-y-1"><Button variant="outline" size="sm" isPending={isPending} onPress={() => startTransition(async () => { const result = await submitApartmentVerification(apartmentId); setMessage(result.error ?? "Submitted for verification."); })}>Request verification</Button>{message ? <p role="status" className="text-xs text-muted-foreground">{message}</p> : null}</div>;
}
