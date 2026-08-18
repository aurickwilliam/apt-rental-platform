import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useCurrentUser } from "@/hooks/auth";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  fetchNotificationPreferences,
  updateNotificationPreferences,
} from "@/service/notifications/notificationService";

import type { NotificationPreferences } from "@/service/notifications/notificationService";

export const getNotificationPreferencesQueryKey = (userId: string) =>
  ["notification-preferences", userId] as const;

export function useNotificationPreferences() {
  const queryClient = useQueryClient();
  const currentUserQuery = useCurrentUser();
  const userId = currentUserQuery.data?.id ?? null;

  const preferencesQuery = useQuery({
    queryKey: getNotificationPreferencesQueryKey(userId as string),
    queryFn: () => fetchNotificationPreferences(userId as string),
    enabled: userId !== null,
  });

  const updatePreferences = useMutation({
    mutationFn: (next: NotificationPreferences) => {
      if (!userId) return Promise.resolve();
      return updateNotificationPreferences(userId, next);
    },
    onMutate: async (next) => {
      if (!userId) return;

      const queryKey = getNotificationPreferencesQueryKey(userId);
      await queryClient.cancelQueries({ queryKey, exact: true });
      const previous = queryClient.getQueryData<NotificationPreferences>(queryKey);

      queryClient.setQueryData(queryKey, next);

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous && userId) {
        queryClient.setQueryData(getNotificationPreferencesQueryKey(userId), context.previous);
      }
    },
    onSettled: () => {
      if (userId) {
        void queryClient.invalidateQueries({
          queryKey: getNotificationPreferencesQueryKey(userId),
          exact: true,
        });
      }
    },
  });

  const setPreferences = (updater: (prev: NotificationPreferences) => NotificationPreferences) => {
    if (!userId) return;
    const queryKey = getNotificationPreferencesQueryKey(userId);
    const current =
      queryClient.getQueryData<NotificationPreferences>(queryKey) ?? DEFAULT_NOTIFICATION_PREFERENCES;
    updatePreferences.mutate(updater(current));
  };

  return {
    preferences: preferencesQuery.data ?? DEFAULT_NOTIFICATION_PREFERENCES,
    loading: currentUserQuery.isLoading || preferencesQuery.isLoading,
    updatePreferences,
    setPreferences,
  };
}