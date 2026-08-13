import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@repo/supabase';
import { useCurrentUser } from 'hooks/auth';
import { type DisplayStatus } from 'hooks/applications';
import { getLandlordApplicationsQueryKey } from 'hooks/applications/useLandlordApplications';

export function useApplicationActions(applicationId: string | undefined) {
  const queryClient = useQueryClient();
  const currentUserQuery = useCurrentUser();
  const landlordId = currentUserQuery.data?.id ?? null;
  const [localStatus, setLocalStatus] = useState<DisplayStatus | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function invalidateApplications() {
    if (landlordId) {
      void queryClient.invalidateQueries({
        queryKey: getLandlordApplicationsQueryKey(landlordId),
        exact: true,
      });
    }
  }

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
      invalidateApplications();
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
      invalidateApplications();
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