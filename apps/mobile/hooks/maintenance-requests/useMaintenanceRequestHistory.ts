import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@repo/supabase';
import { mapRow, MaintenanceRequest } from './useMaintenanceRequests';

type UseMaintenanceRequestHistoryParams = {
  apartmentId?: string;
};

export function useMaintenanceRequestHistory({ apartmentId }: UseMaintenanceRequestHistoryParams) {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!apartmentId) {
      setRequests([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('maintenance_request')
      .select('*')
      .eq('apartment_id', apartmentId)
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setRequests([]);
    } else {
      setRequests(data ? await Promise.all(data.map(mapRow)) : []);
    }
    setLoading(false);
  }, [apartmentId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { requests, loading, error, refetch: fetchHistory };
}
