import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'

import RateTenantSheet from './RateTenantSheet'

const mockSubmit = jest.fn()
const mockToast = jest.fn()

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 34, left: 0, right: 0 }),
}))

jest.mock('@/hooks/useTheme', () => ({
  useColors: () => ({ colors: { rating: '#FACC15', gray300: '#D1D5DB' } }),
}))

jest.mock('@/hooks/ratings', () => ({
  useSubmitTenantReview: () => ({ submitTenantReview: mockSubmit, isSubmitting: false }),
}))

jest.mock('@gorhom/bottom-sheet', () => {
  const { View } = jest.requireActual<typeof import('react-native')>('react-native')
  return {
    BottomSheetScrollView: View,
    BottomSheetFooter: View,
  }
})

jest.mock('heroui-native', () => {
  const React = jest.requireActual<typeof import('react')>('react')
  const { View, Text, TextInput, TouchableOpacity } = jest.requireActual<typeof import('react-native')>('react-native')
  const Passthrough = ({ children }: { children?: React.ReactNode }) => React.createElement(View, null, children)
  const Title = ({ children }: { children?: React.ReactNode }) => React.createElement(Text, null, children)
  const BottomSheet = Object.assign(Passthrough, {
    Portal: Passthrough,
    Overlay: () => null,
    // The real sheet draws `footerComponent` pinned below the scroll area.
    Content: ({ children, footerComponent }: { children?: React.ReactNode; footerComponent?: (props: object) => React.ReactNode }) =>
      React.createElement(View, null, children, footerComponent?.({})),
    Title,
    Description: Title,
  })
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
  return {
    BottomSheet,
    Button,
    FieldError: Title,
    Label: Title,
    TextArea,
    TextField: Passthrough,
    useBottomSheetAwareHandlers: () => ({}),
    useToast: () => ({ toast: { show: mockToast } }),
  }
})

const stay = { tenancyId: 'tenancy-1', apartmentName: 'Unit 5' }

const baseProps = {
  isOpen: true,
  onClose: jest.fn(),
  tenantId: 'tenant-1',
  tenantName: 'Maria Santos',
  stay,
  savedRating: null,
  isLoadingSaved: false,
  loadFailed: false,
  onRetry: jest.fn(),
}

beforeEach(() => {
  mockSubmit.mockReset().mockResolvedValue(undefined)
  mockToast.mockClear()
  baseProps.onClose.mockClear()
  baseProps.onRetry.mockClear()
})

describe('RateTenantSheet', () => {
  it('submits a new rating, shows a toast and closes', async () => {
    render(<RateTenantSheet {...baseProps} />)

    expect(screen.getByText('Rate Maria Santos')).toBeTruthy()
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
    expect(mockToast).toHaveBeenCalledWith({ variant: 'success', label: 'Rating saved' })
    expect(baseProps.onClose).toHaveBeenCalled()
  })

  it('asks for a rating before calling the database', () => {
    render(<RateTenantSheet {...baseProps} />)

    fireEvent.press(screen.getByText('Submit Rating'))

    expect(screen.getByText('Choose a rating from 1 to 5.')).toBeTruthy()
    expect(mockSubmit).not.toHaveBeenCalled()
  })

  it("opens in edit mode seeded with the landlord's own saved rating", () => {
    render(<RateTenantSheet {...baseProps} savedRating={{ rating: 4, comment: 'Paid on time' }} />)

    expect(screen.getByText('Edit your rating')).toBeTruthy()
    expect(screen.getByDisplayValue('Paid on time')).toBeTruthy()
    expect(screen.getByText('Save Changes')).toBeTruthy()
  })

  it('reseeds the draft from the saved rating every time it opens', () => {
    const view = render(<RateTenantSheet {...baseProps} savedRating={{ rating: 4, comment: 'Paid on time' }} />)

    fireEvent.changeText(screen.getByDisplayValue('Paid on time'), 'Changed my mind')
    view.rerender(<RateTenantSheet {...baseProps} isOpen={false} savedRating={{ rating: 4, comment: 'Paid on time' }} />)
    view.rerender(<RateTenantSheet {...baseProps} isOpen savedRating={{ rating: 2, comment: 'Updated elsewhere' }} />)

    expect(screen.getByDisplayValue('Updated elsewhere')).toBeTruthy()
    expect(screen.queryByDisplayValue('Changed my mind')).toBeNull()
  })

  it('pauses saving when the saved rating could not be loaded, and offers a retry', () => {
    render(<RateTenantSheet {...baseProps} loadFailed />)

    expect(screen.getByText(/saving is paused/)).toBeTruthy()
    fireEvent.press(screen.getByLabelText('Rate 3 stars'))
    fireEvent.press(screen.getByText('Submit Rating'))
    expect(mockSubmit).not.toHaveBeenCalled()

    fireEvent.press(screen.getByText('Try again'))
    expect(baseProps.onRetry).toHaveBeenCalled()
  })

  it('shows the database message when saving fails and stays open', async () => {
    mockSubmit.mockRejectedValue(new Error('You can rate a tenant once the lease has ended.'))
    render(<RateTenantSheet {...baseProps} />)

    fireEvent.press(screen.getByLabelText('Rate 2 stars'))
    fireEvent.press(screen.getByText('Submit Rating'))

    expect(await screen.findByText('You can rate a tenant once the lease has ended.')).toBeTruthy()
    expect(baseProps.onClose).not.toHaveBeenCalled()
    expect(mockToast).not.toHaveBeenCalled()
  })
})
