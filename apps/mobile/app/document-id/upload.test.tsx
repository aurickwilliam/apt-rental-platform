import { fireEvent, render, screen } from '@testing-library/react-native'
import { DOCUMENT_TYPES } from '@repo/constants'
import { IconBriefcase2, IconFileCertificate } from '@tabler/icons-react-native'

import Upload from './upload'
import { getDocumentTypeIcon } from './utils/documentTypeIcons'

const mockUpload = jest.fn()
const mockRouter = { replace: jest.fn() }
let mockDocType = 'Payslip'
const today = new Date()
const mockYesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
const mockTomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ docType: mockDocType }),
  useRouter: () => mockRouter,
}))

jest.mock('@/hooks/passport', () => ({
  useUploadPassportDocument: () => ({ mutate: mockUpload, isPending: false, error: null }),
}))

jest.mock('@/hooks/useTheme', () => ({
  useColors: () => ({ colors: { gray400: '#9CA3AF', primary: '#376BF5', warning: '#FACC15' } }),
}))

jest.mock('@/components/layout/ScreenWrapper', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}))

jest.mock('@/components/layout/StandardHeader', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('@/components/inputs/UploadDocumentField', () => {
  const React = jest.requireActual<typeof import('react')>('react')
  const { TouchableOpacity } = jest.requireActual<typeof import('react-native')>('react-native')
  return {
    __esModule: true,
    default: ({ onChange }: { onChange: (value: unknown) => void }) =>
      React.createElement(TouchableOpacity, {
        accessibilityLabel: 'Select test document',
        onPress: () => onChange({
          kind: 'image',
          asset: { uri: 'file:///payslip.jpg', fileName: 'payslip.jpg', mimeType: 'image/jpeg' },
        }),
      }),
  }
})

jest.mock('@/components/inputs/DateField', () => {
  const React = jest.requireActual<typeof import('react')>('react')
  const { TouchableOpacity, Text, View } = jest.requireActual<typeof import('react-native')>('react-native')
  return {
    __esModule: true,
    default: ({ onChange, onClear, error }: { onChange: (date: Date) => void; onClear: () => void; error?: string }) =>
      React.createElement(View, null,
        React.createElement(TouchableOpacity, { accessibilityLabel: 'Select yesterday', onPress: () => onChange(mockYesterday) }),
        React.createElement(TouchableOpacity, { accessibilityLabel: 'Select tomorrow', onPress: () => onChange(mockTomorrow) }),
        React.createElement(TouchableOpacity, { accessibilityLabel: 'Clear expiry date', onPress: onClear }),
        error ? React.createElement(Text, null, error) : null,
      ),
  }
})

jest.mock('@/components/display/ErrorDialog', () => ({ __esModule: true, default: () => null }))

jest.mock('@/components/display/AppDialog', () => {
  const React = jest.requireActual<typeof import('react')>('react')
  const { View, Text, TouchableOpacity } = jest.requireActual<typeof import('react-native')>('react-native')
  return {
    __esModule: true,
    default: ({ isOpen, onOpenChange, title, titleIcon, children }: {
      isOpen: boolean;
      onOpenChange: (open: boolean) => void;
      title: string;
      titleIcon?: React.ReactNode;
      children: React.ReactNode;
    }) => isOpen ? React.createElement(View, { testID: 'legal-dialog' },
      titleIcon,
      React.createElement(Text, null, title),
      children,
      React.createElement(TouchableOpacity, {
        accessibilityLabel: 'Close legal notice',
        onPress: () => onOpenChange(false),
      }),
    ) : null,
  }
})

jest.mock('heroui-native', () => {
  const React = jest.requireActual<typeof import('react')>('react')
  const { View, Text, TouchableOpacity } = jest.requireActual<typeof import('react-native')>('react-native')
  const Passthrough = ({ children }: { children?: React.ReactNode }) => React.createElement(View, null, children)
  const Button = ({ children, onPress, isDisabled, accessibilityLabel }: {
    children?: React.ReactNode;
    onPress?: () => void;
    isDisabled?: boolean;
    accessibilityLabel?: string;
  }) => React.createElement(TouchableOpacity, { onPress, disabled: isDisabled, accessibilityLabel }, children)
  Button.Label = function ButtonLabel({ children }: { children?: React.ReactNode }) {
    return React.createElement(Text, null, children)
  }
  const ControlField = ({ children, onSelectedChange }: { children?: React.ReactNode; onSelectedChange?: () => void }) =>
    React.createElement(TouchableOpacity, { accessibilityLabel: 'Confirm information', onPress: onSelectedChange }, children)
  ControlField.Indicator = Passthrough
  const Label = Passthrough as typeof Passthrough & { Text: typeof Passthrough }
  Label.Text = Passthrough
  const LinkButton = ({ children, onPress }: { children: React.ReactNode; onPress: () => void }) =>
    React.createElement(TouchableOpacity, { onPress }, children)
  LinkButton.Label = Button.Label
  return { Button, Checkbox: Passthrough, ControlField, Label, LinkButton, Spinner: Passthrough }
})

beforeEach(() => {
  mockUpload.mockClear()
  mockDocType = 'Payslip'
})

it('uses the same icon next to the title as the document selection for every type', () => {
  expect(getDocumentTypeIcon('Proof of Income')).toBe(IconBriefcase2)
  expect(getDocumentTypeIcon('Payslip')).toBe(IconFileCertificate)
  expect(getDocumentTypeIcon('Income Tax Return (ITR)')).toBe(IconFileCertificate)
  for (const docType of DOCUMENT_TYPES) {
    mockDocType = docType
    const { unmount } = render(<Upload />)
    expect(screen.getByText(docType)).toBeTruthy()
    const icon = screen.getByTestId('document-type-icon')
    expect(icon.parent?.children[0]).toBe(icon)
    unmount()
  }
})

it('opens the legal notice from a link and dismisses it with the modal close control', () => {
  render(<Upload />)
  expect(screen.queryByTestId('legal-dialog')).toBeNull()
  fireEvent.press(screen.getByText('Legal notice'))
  expect(screen.getByTestId('legal-dialog')).toBeTruthy()
  expect(screen.getByText(/Cybercrime Prevention Act/)).toBeTruthy()
  fireEvent.press(screen.getByLabelText('Close legal notice'))
  expect(screen.queryByTestId('legal-dialog')).toBeNull()
})

it('blocks a past expiry date before uploading', () => {
  render(<Upload />)
  fireEvent.press(screen.getByLabelText('Select test document'))
  fireEvent.press(screen.getByLabelText('Confirm information'))
  fireEvent.press(screen.getByLabelText('Select yesterday'))

  expect(screen.getByText('Expiry date cannot be in the past.')).toBeTruthy()
  fireEvent.press(screen.getByText('Add Document'))
  expect(mockUpload).not.toHaveBeenCalled()
})

it('submits a future expiry and allows clearing it', () => {
  render(<Upload />)
  fireEvent.press(screen.getByLabelText('Select test document'))
  fireEvent.press(screen.getByLabelText('Confirm information'))
  fireEvent.press(screen.getByLabelText('Select tomorrow'))
  fireEvent.press(screen.getByText('Add Document'))

  const expected = `${mockTomorrow.getFullYear()}-${String(mockTomorrow.getMonth() + 1).padStart(2, '0')}-${String(mockTomorrow.getDate()).padStart(2, '0')}`
  expect(mockUpload).toHaveBeenCalledWith(
    expect.objectContaining({ expiresAt: expected }),
    expect.any(Object),
  )

  fireEvent.press(screen.getByLabelText('Clear expiry date'))
  fireEvent.press(screen.getByText('Add Document'))
  expect(mockUpload).toHaveBeenLastCalledWith(
    expect.objectContaining({ expiresAt: null }),
    expect.any(Object),
  )
})
