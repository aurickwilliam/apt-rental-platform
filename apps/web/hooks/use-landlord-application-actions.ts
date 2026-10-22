"use client";

import { useEffect, useRef, useState } from "react";

import {
  approveApplication,
  rejectApplication,
  type DisplayStatus,
} from "@/service/landlordApplicationsService";

export type { DisplayStatus };

export function useLandlordApplicationActions(onStatusChange?: () => Promise<boolean>) {
  const [localStatus, setLocalStatus] = useState<DisplayStatus | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const busy = useRef(false);
  const decided = useRef(false);
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);

  const reconcile = async (status: DisplayStatus) => {
    if (!active.current) return;
    decided.current = true;
    setLocalStatus(status);
    // The write succeeded. Never offer the same decision again while its
    // fresh row is being reconciled, and never reset the details to loading.
    if (onStatusChange && !await onStatusChange() && active.current) {
      setErrorMessage("The decision was saved, but the application could not refresh. Please try loading it again.");
    }
  };

  const approve = async (applicationId: string | undefined) => {
    if (!applicationId || busy.current || decided.current) return;
    busy.current = true;
    setActionLoading(true);
    setErrorMessage(null);
    try {
      await approveApplication(applicationId);
      await reconcile("Approved");
    } catch (err) {
      if (active.current) setErrorMessage(err instanceof Error ? err.message : "Failed to approve application.");
    } finally {
      busy.current = false;
      if (active.current) setActionLoading(false);
    }
  };

  const reject = async (applicationId: string | undefined, reason: string) => {
    if (!applicationId || busy.current || decided.current) return;
    busy.current = true;
    setActionLoading(true);
    setErrorMessage(null);
    try {
      await rejectApplication(applicationId, reason);
      if (!active.current) return;
      setIsRejectDialogOpen(false);
      await reconcile("Rejected");
    } catch (err) {
      if (active.current) setErrorMessage(err instanceof Error ? err.message : "Failed to reject application.");
    } finally {
      busy.current = false;
      if (active.current) setActionLoading(false);
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
