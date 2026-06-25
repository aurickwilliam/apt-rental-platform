import { useState } from 'react';
import { supabase } from '@repo/supabase';
import { type DisplayStatus } from '@/hooks/useLandlordApplications';

export function useApplicationActions(applicationId: string | undefined) {
  const [localStatus, setLocalStatus] = useState<DisplayStatus | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function approve() {
    if (!applicationId) return;
    setActionLoading(true);
    const { error } = await supabase
      .from('rental_application')
      .update({ status: 'approved' })
      .eq('id', applicationId);
    setActionLoading(false);
    if (error) {
      setErrorMessage(error.message);
    } else {
      setLocalStatus('Approved');
    }
  }

  async function reject(reason: string) {
    if (!applicationId) return;
    setActionLoading(true);
    const { error } = await supabase
      .from('rental_application')
      .update({
        status: 'rejected',
        rejected_reason: reason || null,
      })
      .eq('id', applicationId);
    setActionLoading(false);
    if (error) {
      setErrorMessage(error.message);
    } else {
      setLocalStatus('Rejected');
      setIsRejectDialogOpen(false);
    }
  }

  function openRejectDialog() {
    setIsRejectDialogOpen(true);
  }

  function closeRejectDialog() {
    setIsRejectDialogOpen(false);
  }

  function clearError() {
    setErrorMessage(null);
  }

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
