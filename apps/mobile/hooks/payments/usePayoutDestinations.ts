import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createPayoutDestination,
  deletePayoutDestination,
  fetchPayoutDestinations,
  setDefaultPayoutDestination,
  updatePayoutDestination,
  type PayoutDestinationRecord,
  type SavePayoutDestinationParams,
} from '@/service/payments/payoutDestinationService'

export const getPayoutDestinationsQueryKey = () => ['payout-destinations'] as const

export function usePayoutDestinations() {
  return useQuery({
    queryKey: getPayoutDestinationsQueryKey(),
    queryFn: fetchPayoutDestinations,
  })
}

export type CreatePayoutDestinationParams = SavePayoutDestinationParams & { userId: string }

export function useCreatePayoutDestination() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, ...params }: CreatePayoutDestinationParams) =>
      createPayoutDestination(userId, params),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: getPayoutDestinationsQueryKey() })
    },
  })
}

export type UpdatePayoutDestinationParams = SavePayoutDestinationParams & {
  destinationId: string
  userId: string
}

export function useUpdatePayoutDestination() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ destinationId, userId, ...params }: UpdatePayoutDestinationParams) => {
      await updatePayoutDestination(destinationId, params)
      if (params.isDefault) {
        await setDefaultPayoutDestination(userId, destinationId)
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: getPayoutDestinationsQueryKey() })
    },
  })
}

export function useDeletePayoutDestination() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (destinationId: string) => deletePayoutDestination(destinationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: getPayoutDestinationsQueryKey() })
    },
  })
}
