"use client";

import { useState, useTransition } from "react";
import { Button, TextArea } from "@heroui/react";
import type { ReviewResult } from "../actions/verification";

interface ReviewFormProps {
  verificationId: string;
  onReview: (formData: FormData) => Promise<ReviewResult>;
}

export function ReviewForm({ verificationId, onReview }: ReviewFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showReject, setShowReject] = useState(false);

  function submit(status: "approved" | "rejected", formData: FormData) {
    setError(null);
    formData.set("id", verificationId);
    formData.set("status", status);
    startTransition(async () => {
      const result = await onReview(formData);
      if (result.error) setError(result.error);
      else setShowReject(false);
    });
  }

  return (
    <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); submit("rejected", new FormData(event.currentTarget)); }}>
      {showReject ? (
        <TextArea name="reason" required aria-label="Rejection reason" placeholder="Explain what needs to be corrected" />
      ) : null}
      {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="primary" isPending={isPending} onPress={() => submit("approved", new FormData())}>Approve</Button>
        {showReject ? (
          <Button type="submit" variant="danger" isPending={isPending}>Confirm rejection</Button>
        ) : (
          <Button type="button" variant="danger-soft" isDisabled={isPending} onPress={() => setShowReject(true)}>Reject</Button>
        )}
      </div>
    </form>
  );
}
