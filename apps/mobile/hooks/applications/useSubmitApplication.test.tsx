import { act, renderHook } from '@testing-library/react-native'

import type { PassportSelections } from '@/stores/useApplicationFormStore'

import { useSubmitApplication } from './useSubmitApplication'

const mockFrom = jest.fn()
const mockUseProfile = jest.fn()
const mockSetIsSubmitting = jest.fn()
const mockUpload = jest.fn()
const mockRemove = jest.fn()
const mockBytes = jest.fn()

jest.mock('@repo/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    storage: { from: () => ({ upload: mockUpload, remove: mockRemove }) },
  },
}))

jest.mock('expo-file-system', () => ({
  File: jest.fn().mockImplementation(() => ({ bytes: (...args: unknown[]) => mockBytes(...args) })),
}))

jest.mock('expo-crypto', () => ({
  randomUUID: () => 'application-uuid',
}))

jest.mock('hooks/auth', () => ({
  useProfile: () => mockUseProfile(),
}))

const mockStoreState: {
  tenantInformation: { employmentType: string; monthlyIncome: number }
  rentalPreferences: { moveInDate: Date; noOccupants: number }
  documents: { govId: { uri: string }[]; proofOfBilling: { uri: string }[] }
  passportSelections: PassportSelections
  setUploadedPath: jest.Mock
  setPassportSelection: jest.Mock
  setIsSubmitting: jest.Mock
  resetApplicationForm: jest.Mock
  isSubmitting: boolean
} = {
  tenantInformation: { employmentType: 'Student', monthlyIncome: 0 },
  rentalPreferences: { moveInDate: new Date('2026-10-01'), noOccupants: 1 },
  documents: { govId: [{ uri: 'gov-id' }], proofOfBilling: [{ uri: 'proof' }] },
  passportSelections: { govId: null, proofOfIncome: null, proofOfBilling: null, nbiClearance: null },
  setUploadedPath: jest.fn(),
  setPassportSelection: jest.fn(),
  setIsSubmitting: mockSetIsSubmitting,
  resetApplicationForm: jest.fn(),
  isSubmitting: false,
}

jest.mock('@/stores/useApplicationFormStore', () => ({
  useApplicationFormStore: () => mockStoreState,
}))

beforeEach(() => {
  jest.clearAllMocks()
  mockStoreState.documents = { govId: [{ uri: 'gov-id' }], proofOfBilling: [{ uri: 'proof' }] }
  mockStoreState.passportSelections = { govId: null, proofOfIncome: null, proofOfBilling: null, nbiClearance: null }
  mockBytes.mockResolvedValue(new Uint8Array([1]))
  mockUpload.mockResolvedValue({ error: null })
  mockRemove.mockResolvedValue({ error: null })
})

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

it('reuses passport paths by reference without re-uploading', async () => {
  mockUseProfile.mockReturnValue({ profile: { id: 'tenant-1' } })
  mockStoreState.documents = { govId: [], proofOfBilling: [] }
  mockStoreState.passportSelections = {
    govId: 'tenant-1/passport/national-id-1.jpg',
    proofOfIncome: null,
    proofOfBilling: 'tenant-1/passport/proof-of-residency-1.jpg',
    nbiClearance: null,
  }

  const mockSingle = jest.fn().mockResolvedValue({ data: { landlord_id: 'landlord-1' }, error: null })
  const mockInsert = jest.fn().mockResolvedValue({ error: null })
  mockFrom.mockImplementation((table: string) => {
    if (table === 'apartments') {
      return { select: () => ({ eq: () => ({ single: mockSingle }) }) }
    }
    return { insert: mockInsert }
  })

  const { result } = renderHook(() => useSubmitApplication())
  let submission: Awaited<ReturnType<typeof result.current.submit>> | undefined
  await act(async () => {
    submission = await result.current.submit({ apartmentId: 'apartment-id' })
  })

  expect(submission).toEqual({ success: true })
  expect(mockUpload).not.toHaveBeenCalled()
  expect(mockInsert).toHaveBeenCalledWith(
    expect.objectContaining({
      gov_id_url: 'tenant-1/passport/national-id-1.jpg',
      proof_of_billing_url: 'tenant-1/passport/proof-of-residency-1.jpg',
    })
  )
})
