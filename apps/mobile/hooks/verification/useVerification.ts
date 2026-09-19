import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { CURRENT_USER_QUERY_KEY } from '@/utils/queryClient'
import {
  fetchLatestVerification,
  fetchVerificationHistory,
  submitVerification,
  type SubmitVerificationInput,
  type UserVerificationRow,
} from '@/service/verification/verificationService'
import { useCurrentUserId } from 'hooks/auth'

export { buildVerificationInput } from '@/service/verification/verificationService'
export type {
  SubmitVerificationInput,
  UserVerificationRow,
  VerificationImageInput,
} from '@/service/verification/verificationService'

export const getUserVerificationQueryKey = (
  userId: string | null | undefined,
) => ['user-verification', userId ?? null] as const

export const getUserVerificationHistoryQueryKey = (
  userId: string | null | undefined,
  limit = 20,
) => ['user-verification-history', userId ?? null, limit] as const

/**
 * Latest verification submission for the current user (or null when the
 * user never submitted). Server state only — never mirrored in Zustand.
 */
export function useLatestVerification() {
  const userId = useCurrentUserId()

  return useQuery({
    queryKey: getUserVerificationQueryKey(userId),
    queryFn: () =>
      userId ? fetchLatestVerification(userId) : Promise.resolve(null),
    enabled: userId !== null,
  })
}

export function useVerificationHistory(limit = 20) {
  const userId = useCurrentUserId()

  return useQuery({
    queryKey: getUserVerificationHistoryQueryKey(userId, limit),
    queryFn: () =>
      userId
        ? fetchVerificationHistory(userId, limit)
        : Promise.resolve([] as UserVerificationRow[]),
    enabled: userId !== null,
  })
}

export function useSubmitVerification() {
  const queryClient = useQueryClient()
  const userId = useCurrentUserId()

  return useMutation({
    mutationFn: (input: SubmitVerificationInput) => submitVerification(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: getUserVerificationQueryKey(userId),
        exact: true,
      })
      await queryClient.invalidateQueries({
        queryKey: getUserVerificationHistoryQueryKey(userId),
        exact: true,
      })
      // The submission trigger flips users.account_status to pending.
      await queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY })
    },
  })
}
