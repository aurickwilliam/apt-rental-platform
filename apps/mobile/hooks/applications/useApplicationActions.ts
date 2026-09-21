import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@repo/supabase';
import { useCurrentUser } from 'hooks/auth';
import { type DisplayStatus } from 'hooks/applications';
import { getLandlordApplicationsQueryKey } from 'hooks/applications/useLandlordApplications';
import { getLandlordUnitsQueryKey } from 'hooks/apartments/useLandlordUnits';
import { getLandlordTenancyQueryKey } from 'hooks/tenancy/useLandlordTenancy';

const OCCUPIED_ERROR_MESSAGE =
  'This unit is already occupied and cannot accept another tenant. Vacate it first, then approve.';

export function useApplicationActions(
  applicationId: string | undefined,
  apartmentId?: string,
) {
  const queryClient = useQueryClient();
  const currentUserQuery = useCurrentUser();
  const landlordId = currentUserQuery.data?.id ?? null;
  const [localStatus, setLocalStatus] = useState<DisplayStatus | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function invalidateAfterStatusChange() {
    if (landlordId) {
      void queryClient.invalidateQueries({
        queryKey: getLandlordApplicationsQueryKey(landlordId),
        exact: true,
      });
      // Approval flips apartments.status to occupied; vacate flips it back.
      // Units list caches that flag, so it must go stale together.
      void queryClient.invalidateQueries({
        queryKey: getLandlordUnitsQueryKey(landlordId),
        exact: true,
      });
    }
    if (apartmentId) {
      void queryClient.invalidateQueries({
        queryKey: getLandlordTenancyQueryKey(apartmentId),
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
      setErrorMessage(
        error.message.includes('already occupied')
          ? OCCUPIED_ERROR_MESSAGE
          : error.message,
      );
    } else {
      setLocalStatus('Approved');
      invalidateAfterStatusChange();
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
      invalidateAfterStatusChange();
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