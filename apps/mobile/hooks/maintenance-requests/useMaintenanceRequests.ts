import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@repo/supabase';

export type MaintenanceRequestStatus = 'Pending' | 'In Progress' | 'Resolved';
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
};

const DB_TO_DISPLAY_STATUS: Record<string, MaintenanceRequestStatus> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  resolved: 'Resolved',
};

const DISPLAY_TO_DB_STATUS: Record<MaintenanceRequestStatus, string> = {
  Pending: 'pending',
  'In Progress': 'in_progress',
  Resolved: 'resolved',
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
      .neq('status', 'resolved')
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

  return { activeRequest, loading, error, advanceStatus, refetch: fetchRequest };
}
