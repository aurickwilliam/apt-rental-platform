"use client";

import { useState } from "react";

import {
  approveApplication,
  rejectApplication,
  type DisplayStatus,
} from "@/service/landlordApplicationsService";

export type { DisplayStatus };

export function useLandlordApplicationActions(onStatusChange?: () => void) {
  const [localStatus, setLocalStatus] = useState<DisplayStatus | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const approve = async (applicationId: string | undefined) => {
    if (!applicationId) return;
    setActionLoading(true);
    setErrorMessage(null);
    try {
      await approveApplication(applicationId);
      setLocalStatus("Approved");
      onStatusChange?.();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to approve application.");
    } finally {
      setActionLoading(false);
    }
  };

  const reject = async (applicationId: string | undefined, reason: string) => {
    if (!applicationId) return;
    setActionLoading(true);
    setErrorMessage(null);
    try {
      await rejectApplication(applicationId, reason);
      setLocalStatus("Rejected");
      setIsRejectDialogOpen(false);
      onStatusChange?.();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to reject application.");
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectDialog = () => setIsRejectDialogOpen(true);
  const closeRejectDialog = () => setIsRejectDialogOpen(false);
  const clearError = () => setErrorMessage(null);

  return {
    localStatus,
    actionLoading,
    isRejectDialogOpen,
    errorMessage,
    approve,
    reject,
    openRejectDialog,
    closeRejectDialog,
    clearError,
  };
}
