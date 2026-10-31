import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'

import RateTenant from './rate-tenant'

const mockSubmit = jest.fn()
const mockRefetch = jest.fn()
const mockBack = jest.fn()
let mockReviews: Record<string, unknown>[] = []
let mockFailed = false

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({
    tenancyId: 'tenancy-1',
    tenantId: 'tenant-1',
    tenantName: 'Maria Santos',
    apartmentName: 'Unit 5',
  }),
  useRouter: () => ({ back: mockBack }),
}))

jest.mock('@/hooks/ratings', () => ({
  useTenantReviews: () => ({
    reviews: mockReviews,
    loading: false,
    isError: mockFailed,
    refetch: mockRefetch,
  }),
  useSubmitTenantReview: () => ({ submitTenantReview: mockSubmit, isSubmitting: false }),
}))

jest.mock('hooks/useTheme', () => ({
  useColors: () => ({ colors: { rating: '#FACC15', gray300: '#D1D5DB' } }),
}))

jest.mock('components/layout/ScreenWrapper', () => {
  const React = jest.requireActual<typeof import('react')>('react')
  return {
    __esModule: true,
    default: ({ header, children }: { header?: React.ReactNode; children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, header, children),
  }
})

jest.mock('components/layout/StandardHeader', () => {
  const React = jest.requireActual<typeof import('react')>('react')
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native')
  return { __esModule: true, default: ({ title }: { title: string }) => React.createElement(Text, null, title) }
})

jest.mock('components/display/ErrorDialog', () => {
  const React = jest.requireActual<typeof import('react')>('react')
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native')
  return {
    __esModule: true,
    default: ({ message }: { message: string | null }) => (message ? React.createElement(Text, null, message) : null),
  }
})

jest.mock('heroui-native', () => {
  const React = jest.requireActual<typeof import('react')>('react')
  const { View, Text, TextInput, TouchableOpacity } = jest.requireActual<typeof import('react-native')>('react-native')
  const Passthrough = ({ children }: { children?: React.ReactNode }) => React.createElement(View, null, children)
  const Button = ({ children, onPress, isDisabled }: {
    children?: React.ReactNode
    onPress?: () => void
    isDisabled?: boolean
  }) => React.createElement(TouchableOpacity, { onPress, disabled: isDisabled }, children)
  Button.Label = function ButtonLabel({ children }: { children?: React.ReactNode }) {
    return React.createElement(Text, null, children)
  }
  const TextArea = ({ value, onChangeText, placeholder }: {
    value: string
    onChangeText: (text: string) => void
    placeholder?: string
  }) => React.createElement(TextInput, { value, onChangeText, placeholder })
  const FieldError = ({ children }: { children?: React.ReactNode }) => React.createElement(Text, null, children)
  const Label = ({ children }: { children?: React.ReactNode }) => React.createElement(Text, null, children)
  return { Button, FieldError, Label, TextArea, TextField: Passthrough }
})

const mine = (overrides: Record<string, unknown> = {}) => ({
  id: 'review-1',
  tenancyId: 'tenancy-1',
  landlordId: 'landlord-1',
  rating: 4,
  comment: 'Paid on time',
  isMine: true,
  ...overrides,
})

beforeEach(() => {
  mockSubmit.mockReset().mockResolvedValue(undefined)
  mockRefetch.mockClear()
  mockBack.mockClear()
  mockReviews = []
  mockFailed = false
})

describe('RateTenant', () => {
  it('submits a new rating with the comment and goes back', async () => {
    render(<RateTenant />)

    fireEvent.press(screen.getByLabelText('Rate 5 stars'))
    fireEvent.changeText(screen.getByPlaceholderText(/Paid on time/), '  Tidy unit  ')
    fireEvent.press(screen.getByText('Submit Rating'))

    await waitFor(() =>
      expect(mockSubmit).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        tenancyId: 'tenancy-1',
        rating: 5,
        comment: '  Tidy unit  ',
      }),
    )
    expect(mockBack).toHaveBeenCalled()
  })

  it('asks for a rating before calling the database', () => {
    render(<RateTenant />)

    fireEvent.press(screen.getByText('Submit Rating'))

    expect(screen.getByText('Choose a rating from 1 to 5.')).toBeTruthy()
    expect(mockSubmit).not.toHaveBeenCalled()
  })

  it('opens in edit mode seeded with the landlord\'s own saved rating', () => {
    mockReviews = [mine()]
    render(<RateTenant />)

    expect(screen.getByText('Edit Tenant Rating')).toBeTruthy()
    expect(screen.getByText('4.0')).toBeTruthy()
    expect(screen.getByDisplayValue('Paid on time')).toBeTruthy()
    expect(screen.getByText('Save Changes')).toBeTruthy()
  })

  it('does not treat another landlord\'s rating of the same stay as the viewer\'s own', () => {
    mockReviews = [mine({ isMine: false })]
    render(<RateTenant />)

    expect(screen.getByText('Rate Tenant')).toBeTruthy()
    expect(screen.getByText('0.0')).toBeTruthy()
    expect(screen.queryByDisplayValue('Paid on time')).toBeNull()
  })

  it('pauses saving when the saved rating could not be loaded, and offers a retry', () => {
    mockFailed = true
    render(<RateTenant />)

    expect(screen.getByText(/saving is paused/)).toBeTruthy()

    fireEvent.press(screen.getByLabelText('Rate 3 stars'))
    fireEvent.press(screen.getByText('Submit Rating'))
    expect(mockSubmit).not.toHaveBeenCalled()

    fireEvent.press(screen.getByText('Try again'))
    expect(mockRefetch).toHaveBeenCalled()
  })

  it('shows the database message when saving fails and stays on the screen', async () => {
    mockSubmit.mockRejectedValue(new Error('You can rate a tenant once the lease has ended.'))
    render(<RateTenant />)

    fireEvent.press(screen.getByLabelText('Rate 2 stars'))
    fireEvent.press(screen.getByText('Submit Rating'))

    expect(await screen.findByText('You can rate a tenant once the lease has ended.')).toBeTruthy()
    expect(mockBack).not.toHaveBeenCalled()
  })
})
