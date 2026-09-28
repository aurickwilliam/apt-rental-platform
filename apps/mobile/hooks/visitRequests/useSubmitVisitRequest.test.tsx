import { act, renderHook } from '@testing-library/react-native'

import { useSubmitVisitRequest } from './useSubmitVisitRequest'

const mockFrom = jest.fn()

jest.mock('@repo/supabase', () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...args) },
}))

jest.mock('hooks/auth', () => ({
  useProfile: () => ({ profile: { id: 'owner-id' } }),
}))

it('rejects an own-property visit before inserting a request', async () => {
  const { result } = renderHook(() => useSubmitVisitRequest())
  let response: { success: boolean } | undefined

  await act(async () => {
    response = await result.current.submitVisitRequest({
      apartmentId: 'apartment-id',
      applicationId: 'application-id',
      landlordId: 'owner-id',
      date: new Date('2026-10-01'),
      hour: '10',
      period: 'AM',
      noVisitors: 1,
      notes: '',
    })
  })

  expect(response).toEqual({ success: false })
  expect(result.current.error).toBe('You cannot request a visit to your own property.')
  expect(mockFrom).not.toHaveBeenCalled()
})
