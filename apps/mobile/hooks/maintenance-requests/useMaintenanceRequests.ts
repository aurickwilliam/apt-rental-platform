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

const isFinalStatus = (status: MaintenanceRequestStatus) =>
  status === 'Resolved' || status === 'Cancelled';

export async function mapRow(row: any): Promise<MaintenanceRequest> {
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
  const [latestRequest, setLatestRequest] = useState<MaintenanceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequest = useCallback(async () => {
    if (!apartmentId) {
      setLatestRequest(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('maintenance_request')
      .select('*')
      .eq('apartment_id', apartmentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      setError(fetchError.message);
      setLatestRequest(null);
    } else {
      setLatestRequest(data ? await mapRow(data) : null);
    }
    setLoading(false);
  }, [apartmentId]);

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  const canCancel = (status: MaintenanceRequestStatus) =>
    status === 'Pending' || status === 'In Progress';

  // Derived for backward compatibility with any code that expects "an active,
  const activeRequest =
    latestRequest && canCancel(latestRequest.status) ? latestRequest : null;

  const isFinal = latestRequest ? isFinalStatus(latestRequest.status) : false;

  const cancelRequest = async (target?: MaintenanceRequest) => {
    const requestToCancel = target ?? activeRequest;
    if (!requestToCancel) {
      return { success: false as const, error: 'No maintenance request to cancel.' };
    }
    if (!canCancel(requestToCancel.status)) {
      return { success: false as const, error: 'This request can no longer be cancelled.' };
    }

    const isLocal = latestRequest?.id === requestToCancel.id;
    const previous = latestRequest;
    if (isLocal) {
      setLatestRequest({ ...requestToCancel, status: 'Cancelled' });
    }

    const { error: updateError } = await supabase
      .from('maintenance_request')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', requestToCancel.id);

    if (updateError) {
      if (isLocal) setLatestRequest(previous);
      setError(updateError.message);
      return { success: false as const, error: updateError.message };
    }

    return { success: true as const };
  };

  return {
    latestRequest,
    activeRequest,
    isFinal,
    loading,
    error,
    cancelRequest,
    canCancel,
    refetch: fetchRequest,
  };
}
