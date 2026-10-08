import { act, renderHook } from '@testing-library/react-native'

import type { PassportDocumentRow } from '@/service/passport/passportService'

import { useSubmitApplication } from './useSubmitApplication'

const mockFrom = jest.fn()
const mockUseProfile = jest.fn()
const mockSetIsSubmitting = jest.fn()
const mockResetForm = jest.fn()
const mockFetchPassport = jest.fn()

jest.mock('@repo/supabase', () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...args) },
}))

jest.mock('hooks/auth', () => ({
  useProfile: () => mockUseProfile(),
}))

jest.mock('@/service/passport/passportService', () => ({
  ...jest.requireActual('@/service/passport/passportService'),
  fetchPassportDocumentsWithVerification: (...args: unknown[]) => mockFetchPassport(...args),
}))

const mockStoreState = {
  tenantInformation: {
    employmentType: 'Student',
    monthlyIncome: 0,
    occupation: '',
    companyName: '',
    previousLandlordName: '',
    previousLandlordContact: '',
  },
  rentalPreferences: {
    moveInDate: new Date('2026-10-01'),
    noOccupants: 1,
    hasPets: false,
    isSmoker: false,
    needParking: false,
    additionalNotes: '',
  },
  setIsSubmitting: mockSetIsSubmitting,
  resetApplicationForm: mockResetForm,
  isSubmitting: false,
}

jest.mock('@/stores/useApplicationFormStore', () => ({
  useApplicationFormStore: () => mockStoreState,
}))

const baseDoc: PassportDocumentRow = {
  id: 'doc',
  user_id: 'tenant-1',
  doc_type: 'Passport',
  storage_path: 'tenant-1/passport/x.jpg',
  storage_path_back: null,
  mime_type: 'image/jpeg',
  id_type: null,
  verification_id: null,
  is_verified: false,
  is_primary: false,
  review_status: 'unverified',
  requested_at: null,
  reviewed_at: null,
  reviewed_by: null,
  rejection_reason: null,
  expires_at: null,
  created_at: '2026-10-01T00:00:00.000Z',
  updated_at: null,
}

const govId: PassportDocumentRow = {
  ...baseDoc,
  id: 'gov',
  storage_path: 'tenant-1/ver-1/id-front.jpg',
  id_type: 'Passport',
  verification_id: 'ver-1',
  storage_path_back: 'tenant-1/ver-1/id-back.jpg',
  is_primary: true,
  is_verified: true,
}
const billing: PassportDocumentRow = {
  ...baseDoc,
  id: 'bill',
  doc_type: 'Proof of Residency',
  storage_path: 'tenant-1/passport/residency.pdf',
}

function mockApartment(landlordId: string, insert = jest.fn().mockResolvedValue({ error: null })) {
  mockFrom.mockImplementation((table: string) =>
    table === 'apartments'
      ? { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { landlord_id: landlordId }, error: null }) }) }) }
      : { insert }
  )
  return insert
}

async function submitApplication() {
  const { result } = renderHook(() => useSubmitApplication())
  let submission: Awaited<ReturnType<typeof result.current.submit>> | undefined
  await act(async () => {
    submission = await result.current.submit({ apartmentId: 'apartment-id' })
  })
  return submission
}

beforeEach(() => {
  jest.clearAllMocks()
  mockUseProfile.mockReturnValue({ profile: { id: 'tenant-1', account_status: 'verified' } })
  mockFetchPassport.mockResolvedValue([govId, billing])
})

it('attaches passport documents by reference without uploading', async () => {
  const insert = mockApartment('landlord-1')

  expect(await submitApplication()).toEqual({ success: true })
  expect(insert).toHaveBeenCalledWith(
    expect.objectContaining({
      gov_id_url: 'tenant-1/ver-1/id-front.jpg',
      proof_of_billing_url: 'tenant-1/passport/residency.pdf',
      gov_id_back_url: 'tenant-1/ver-1/id-back.jpg',
      proof_of_income_url: null,
      nbi_clearance_url: null,
      status: 'pending',
    })
  )
  expect(mockResetForm).toHaveBeenCalled()
})

it('omits the ID back when the attached ID is not verification-linked', async () => {
  mockFetchPassport.mockResolvedValue([
    { ...govId, verification_id: null, storage_path_back: 'tenant-1/passport/back.jpg' },
    billing,
  ])
  const insert = mockApartment('landlord-1')

  expect(await submitApplication()).toEqual({ success: true })
  expect(insert).toHaveBeenCalledWith(expect.objectContaining({ gov_id_back_url: null }))
})

it('rejects an own-property application', async () => {
  const insert = mockApartment('tenant-1')

  expect(await submitApplication()).toEqual({
    success: false,
    error: 'You cannot apply to your own property.',
  })
  expect(insert).not.toHaveBeenCalled()
})

it('blocks unverified accounts', async () => {
  mockUseProfile.mockReturnValue({ profile: { id: 'tenant-1', account_status: 'unverified' } })
  const insert = mockApartment('landlord-1')

  const submission = await submitApplication()
  expect(submission?.success).toBe(false)
  expect(submission?.error).toMatch(/Verify your account/)
  expect(insert).not.toHaveBeenCalled()
})

it('blocks submission when the passport lacks a required document', async () => {
  mockFetchPassport.mockResolvedValue([govId])
  const insert = mockApartment('landlord-1')

  const submission = await submitApplication()
  expect(submission?.error).toMatch(/Proof of Billing/)
  expect(insert).not.toHaveBeenCalled()
})

it('requires proof of income for employed tenants', async () => {
  mockStoreState.tenantInformation.employmentType = 'Full-Time'
  try {
    const insert = mockApartment('landlord-1')
    const submission = await submitApplication()
    expect(submission?.error).toMatch(/Proof of Income/)
    expect(insert).not.toHaveBeenCalled()
  } finally {
    mockStoreState.tenantInformation.employmentType = 'Student'
  }
})

it('reports a duplicate active application', async () => {
  mockApartment(
    'landlord-1',
    jest.fn().mockResolvedValue({
      error: { message: 'duplicate key value violates unique_active_application_per_tenant_apartment' },
    })
  )

  expect(await submitApplication()).toEqual({
    success: false,
    error: 'You already have an active application for this apartment.',
  })
  expect(mockResetForm).not.toHaveBeenCalled()
})
