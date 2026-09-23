"use client";

import { useState } from "react";

import {
  approveVisitRequest,
  rejectVisitRequest,
  rescheduleVisitRequest,
} from "@/service/landlordVisitRequestsService";

export function useLandlordVisitRequestActions(
  requestId: string | undefined,
  onSuccess?: () => void,
) {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const approve = async () => {
    if (!requestId) return false;
    setIsApproving(true);
    setErrorMessage(null);
    try {
      await approveVisitRequest(requestId);
      onSuccess?.();
      return true;
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to approve visit request.");
      return false;
    } finally {
      setIsApproving(false);
    }
  };

  const reject = async (reason: string) => {
    if (!requestId) return false;
    setIsRejecting(true);
    setErrorMessage(null);
    try {
      await rejectVisitRequest(requestId, reason);
      onSuccess?.();
      return true;
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to reject visit request.");
      return false;
    } finally {
      setIsRejecting(false);
    }
  };

  const reschedule = async (confirmedDate: string, confirmedTime: string) => {
    if (!requestId) return false;
    setIsRescheduling(true);
    setErrorMessage(null);
    try {
      await rescheduleVisitRequest(requestId, confirmedDate, confirmedTime);
      onSuccess?.();
      return true;
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to reschedule visit request.");
      return false;
    } finally {
      setIsRescheduling(false);
    }
  };

  return { approve, reject, reschedule, isApproving, isRejecting, isRescheduling, errorMessage };
}
