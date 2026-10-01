import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useCurrentUserId } from 'hooks/auth'
import {
  deletePassportDocument,
  fetchPassportDocumentsWithVerification,
  fetchPassportVerifiedPaths,
  linkApprovedVerification,
  uploadPassportDocument,
  type PassportDocumentRow,
  type UploadPassportDocumentInput,
} from '@/service/passport/passportService'

export type { PassportDocumentRow }

export const getPassportDocumentsQueryKey = (userId: string | null | undefined) =>
  ['passport-documents', userId ?? null] as const

/**
 * The signed-in user's passport (document wallet). Server state only —
 * never mirrored in Zustand.
 */
export function usePassportDocuments() {
  const userId = useCurrentUserId()

  const query = useQuery({
    queryKey: getPassportDocumentsQueryKey(userId),
    // Links the approved verification ID as the primary row inside the same
    // read, so `loading` stays true until the wallet is authoritative.
    queryFn: () =>
      userId ? fetchPassportDocumentsWithVerification(userId) : Promise.resolve([]),
    enabled: userId !== null,
  })

  return {
    documents: query.data ?? [],
    loading: query.isLoading,
    refreshing: query.isFetching && !query.isLoading,
    error: query.error?.message ?? null,
    refetch: query.refetch,
  }
}

export function useUploadPassportDocument() {
  const queryClient = useQueryClient()
  const userId = useCurrentUserId()

  return useMutation({
    mutationFn: (input: Omit<UploadPassportDocumentInput, 'userId'>) => {
      if (!userId) throw new Error('You must be signed in to add a document.')
      return uploadPassportDocument({ ...input, userId })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: getPassportDocumentsQueryKey(userId),
        exact: true,
      })
    },
  })
}

export function useDeletePassportDocument() {
  const queryClient = useQueryClient()
  const userId = useCurrentUserId()

  return useMutation({
    mutationFn: (input: { id: string; storagePath: string }) => {
      if (!userId) throw new Error('You must be signed in to delete a document.')
      return deletePassportDocument({ ...input, userId })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: getPassportDocumentsQueryKey(userId),
        exact: true,
      })
    },
  })
}

/**
 * Ensures the latest approved ID verification is linked into the passport.
 * Safe to call on passport open — idempotent server-side.
 */
export function useLinkApprovedVerification() {
  const queryClient = useQueryClient()
  const userId = useCurrentUserId()

  return useMutation({
    mutationFn: () => {
      if (!userId) throw new Error('You must be signed in to link your verified ID.')
      return linkApprovedVerification(userId)
    },
    onSuccess: async (linked) => {
      if (linked) {
        await queryClient.invalidateQueries({
          queryKey: getPassportDocumentsQueryKey(userId),
          exact: true,
        })
      }
    },
  })
}

export const getPassportVerifiedPathsQueryKey = (
  userId: string | null | undefined,
  pathsKey: string
) => ['passport-verified-paths', userId ?? null, pathsKey] as const

/**
 * Which of the given storage paths are verified passport docs for a tenant.
 * Used by landlord application views to badge verified attachments.
 */
export function usePassportVerifiedPaths(
  tenantId: string | null | undefined,
  paths: readonly string[]
) {
  const pathsKey = [...new Set(paths.filter(Boolean))].sort().join('\u0001')

  return useQuery({
    queryKey: getPassportVerifiedPathsQueryKey(tenantId, pathsKey),
    queryFn: () =>
      tenantId
        ? fetchPassportVerifiedPaths(tenantId, pathsKey.split('\u0001'))
        : Promise.resolve(new Set<string>()),
    enabled: tenantId != null && pathsKey.length > 0,
  })
}
