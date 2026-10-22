"use client";

import { Button } from "@heroui/react";

interface ReconciliationNoticeProps {
  pending: boolean;
  error: string | null;
  onRetry: () => void;
}

export default function ReconciliationNotice({ pending, error, onRetry }: ReconciliationNoticeProps) {
  if (!pending && !error) return null;
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-sm text-card-foreground" role={error ? "alert" : "status"}>
      <p>{error ?? "Updating details. The last loaded status is shown until the latest details are verified."}</p>
      {error && <Button variant="secondary" size="sm" className="mt-3" isDisabled={pending} onPress={onRetry}>Refresh details</Button>}
    </div>
  );
}
