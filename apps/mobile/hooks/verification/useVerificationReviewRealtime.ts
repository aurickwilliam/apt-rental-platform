import { useQueryClient } from '@tanstack/react-query'

import { useCurrentUserId } from 'hooks/auth'
import { CURRENT_USER_QUERY_KEY } from '@/utils/queryClient'
import { useNotificationRealtime } from '@/hooks/notifications'
import type { NotificationRow } from '@/service/notifications/notificationService'

import {
  getUserVerificationHistoryQueryKey,
  getUserVerificationQueryKey,
} from './useVerification'

function isVerificationReview(row: NotificationRow): boolean {
  if (row.type !== 'system') return false
  const data = row.data as { screen?: unknown } | null
  return typeof data === 'object' && data !== null && data.screen === 'verification'
}

/**
 * Refreshes verification state the moment an admin approves or rejects the
 * review. The review trigger already inserts a `system` verification
 * notification, which arrives over the shared notifications channel — this
 * hook turns that event into exact-key invalidation, so the profile tab (and
 * the passport lock) updates without an app restart. No new channel.
 */
export function useVerificationReviewRealtime() {
  const queryClient = useQueryClient()
  const userId = useCurrentUserId()

  useNotificationRealtime(userId, {
    onInsert: (row) => {
      if (!isVerificationReview(row)) return

      void queryClient.invalidateQueries({
        queryKey: getUserVerificationQueryKey(userId),
        exact: true,
      })
      void queryClient.invalidateQueries({
        queryKey: getUserVerificationHistoryQueryKey(userId),
      })
      void queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY })
    },
  })
}
