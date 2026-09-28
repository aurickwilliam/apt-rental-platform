import { act, renderHook } from '@testing-library/react-native'

import { useSubmitApplication } from './useSubmitApplication'

const mockFrom = jest.fn()
const mockUseProfile = jest.fn()
const mockSetIsSubmitting = jest.fn()

jest.mock('@repo/supabase', () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...args) },
}))

jest.mock('hooks/auth', () => ({
  useProfile: () => mockUseProfile(),
}))

jest.mock('@/stores/useApplicationFormStore', () => ({
  useApplicationFormStore: () => ({
    tenantInformation: { employmentType: 'Student', monthlyIncome: 0 },
    rentalPreferences: { moveInDate: new Date('2026-10-01'), noOccupants: 1 },
    documents: { govId: [{ uri: 'gov-id' }], proofOfBilling: [{ uri: 'proof' }] },
    setUploadedPath: jest.fn(),
    setIsSubmitting: mockSetIsSubmitting,
    resetApplicationForm: jest.fn(),
    isSubmitting: false,
  }),
}))

it('rejects an own-property application before uploading any documents', async () => {
  mockUseProfile.mockReturnValue({ profile: { id: 'owner-id' } })
  const mockSingle = jest.fn().mockResolvedValue({ data: { landlord_id: 'owner-id' }, error: null })
  mockFrom.mockReturnValue({ select: () => ({ eq: () => ({ single: mockSingle }) }) })

  const { result } = renderHook(() => useSubmitApplication())
  let submission: Awaited<ReturnType<typeof result.current.submit>> | undefined
  await act(async () => {
    submission = await result.current.submit({ apartmentId: 'apartment-id' })
  })

  expect(submission).toEqual({ success: false, error: 'You cannot apply to your own property.' })
  expect(mockFrom).toHaveBeenCalledWith('apartments')
  expect(mockFrom).toHaveBeenCalledTimes(1)
  expect(mockSetIsSubmitting).not.toHaveBeenCalled()
})
