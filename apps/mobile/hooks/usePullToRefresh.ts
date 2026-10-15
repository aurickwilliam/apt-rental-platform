import { useCallback, useState } from "react";

/**
 * Pull-to-refresh state that only reflects a refresh the user started, so
 * background refetches (realtime, focus) never show the spinner.
 */
export function usePullToRefresh(refresh: () => Promise<unknown>) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } catch (error) {
      console.error("[pull-to-refresh] Refresh failed:", error);
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  return { refreshing, onRefresh };
}
