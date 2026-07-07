import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@repo/supabase';

export type MaintenanceRequestStatus = 'Pending' | 'In Progress' | 'Resolved' | 'Cancelled';
export type MaintenanceRequestUrgency = 'low' | 'medium' | 'high';

export type MaintenanceRequest = {
  id: string;
  title: string;
  category: string;
  message: string;
  urgency: MaintenanceRequestUrgency;
  status: MaintenanceRequestStatus;
  image_urls: string[];
  created_at: string;
  resolved_at: string | null;
  resolution_notes: string | null;
  tenant_id: string;
  apartment_id: string;
  landlord_id: string | null;
  cancelled_at: string | null;
};

const DB_TO_DISPLAY_STATUS: Record<string, MaintenanceRequestStatus> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  cancelled: 'Cancelled',
};

const DISPLAY_TO_DB_STATUS: Record<MaintenanceRequestStatus, string> = {
  Pending: 'pending',
  'In Progress': 'in_progress',
  Resolved: 'resolved',
  Cancelled: 'cancelled',
};

const getNextStatus = (status: MaintenanceRequestStatus): MaintenanceRequestStatus => {
  if (status === 'Pending') return 'In Progress';
  if (status === 'In Progress') return 'Resolved';
  return 'Resolved';
};

async function mapRow(row: any): Promise<MaintenanceRequest> {
  const paths: string[] = row.image_urls ?? [];
  let resolvedUrls: string[] = [];

  if (paths.length > 0) {
    const { data, error } = await supabase.storage
      .from('maintenance-images')
      .createSignedUrls(paths, 60 * 55); // 55 min, matches your existing TTL pattern

    if (!error && data) {
      resolvedUrls = data.map((d) => d.signedUrl);
    }
  }

  return {
    ...row,
    status: DB_TO_DISPLAY_STATUS[row.status] ?? 'Pending',
    image_urls: resolvedUrls,
  };
}

type UseMaintenanceRequestsParams = {
  apartmentId?: string;
};

export function useMaintenanceRequests({ apartmentId }: UseMaintenanceRequestsParams) {
  const [activeRequest, setActiveRequest] = useState<MaintenanceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequest = useCallback(async () => {
    if (!apartmentId) {
      setActiveRequest(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('maintenance_request')
      .select('*')
      .eq('apartment_id', apartmentId)
      .not('status', 'in', '(resolved,cancelled)')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      setError(fetchError.message);
      setActiveRequest(null);
    } else {
      setActiveRequest(data ? await mapRow(data) : null);
    }

    setLoading(false);
  }, [apartmentId]);

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  const advanceStatus = async () => {
    if (!activeRequest) return;

    const nextStatus = getNextStatus(activeRequest.status);
    const previous = activeRequest;

    setActiveRequest({ ...activeRequest, status: nextStatus });

    const { error: updateError } = await supabase
      .from('maintenance_request')
      .update({
        status: DISPLAY_TO_DB_STATUS[nextStatus],
        resolved_at: nextStatus === 'Resolved' ? new Date().toISOString() : null,
      })
      .eq('id', activeRequest.id);

    if (updateError) {
      setActiveRequest(previous);
      setError(updateError.message);
    } else if (nextStatus === 'Resolved') {
      setActiveRequest(null);
    }
  };

  const canCancel = (status: MaintenanceRequestStatus) =>
    status === 'Pending' || status === 'In Progress';

  const cancelRequest = async (target?: MaintenanceRequest) => {
    const requestToCancel = target ?? activeRequest;

    if (!requestToCancel) {
      return { success: false as const, error: 'No maintenance request to cancel.' };
    }
    if (!canCancel(requestToCancel.status)) {
      return { success: false as const, error: 'This request can no longer be cancelled.' };
    }

    // Only touch local state if this hook instance is actually the one tracking this request
    const isLocal = activeRequest?.id === requestToCancel.id;
    const previous = activeRequest;

    if (isLocal) {
      setActiveRequest({ ...requestToCancel, status: 'Cancelled' });
    }

    const { error: updateError } = await supabase
      .from('maintenance_request')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', requestToCancel.id);

    if (updateError) {
      if (isLocal) setActiveRequest(previous);
      setError(updateError.message);
      return { success: false as const, error: updateError.message };
    }

    if (isLocal) setActiveRequest(null);
    return { success: true as const };
  };

  return {
    activeRequest,
    loading,
    error,
    advanceStatus,
    cancelRequest,
    canCancel,
    refetch: fetchRequest
  };
}
