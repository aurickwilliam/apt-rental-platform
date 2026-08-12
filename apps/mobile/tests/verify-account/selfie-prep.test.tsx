import { fireEvent, render, screen } from '@testing-library/react-native';

import SelfiePrep from '@/app/(auth)/verify-account/selfie-prep';
import { initialVerificationState, useVerificationStore } from '@/stores/useVerificationStore';

jest.mock('@/hooks/useTheme', () => ({
  useColors: () => ({
    colors: { textPrimary: '#333333', primary: '#376BF5', success: '#22C55E' },
    isDark: false,
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack, replace: mockReplace }),
}));

jest.mock('heroui-native', () => {
  const { Text, TouchableOpacity } = require('react-native');

  const ButtonRoot = ({ children, onPress, ...rest }: any) => (
    <TouchableOpacity onPress={onPress} {...rest}>{children}</TouchableOpacity>
  );
  const ButtonLabel = ({ children }: any) => <Text>{children}</Text>;

  return {
    Button: Object.assign(ButtonRoot, { Label: ButtonLabel }),
    CloseButton: ({ children, onPress }: any) => (
      <TouchableOpacity testID="close-button" onPress={onPress}>{children}</TouchableOpacity>
    ),
  };
});

const FRONT_CAPTURE = { uri: 'file://front.jpg', width: 100, height: 63 };
const BACK_CAPTURE = { uri: 'file://back.jpg', width: 100, height: 63 };

describe('SelfiePrep', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useVerificationStore.setState({ ...initialVerificationState });
  });

  it('shows the illustrated selfie guidance after all required ID captures are complete', () => {
    useVerificationStore.setState({
      selectedId: 'National ID (PhilSys/PhilID)',
      captures: { front: FRONT_CAPTURE, back: BACK_CAPTURE },
    });
    render(<SelfiePrep />);

    expect(screen.getByText('Get ready for your selfie')).toBeTruthy();
    expect(screen.getByText(/Remove glasses, hats, and face coverings/i)).toBeTruthy();
    expect(screen.getByText(/Use bright, even lighting/i)).toBeTruthy();
    expect(screen.getByText(/Keep your full face visible/i)).toBeTruthy();
    expect(screen.getByLabelText('Selfie preparation illustration')).toBeTruthy();
    expect(screen.getByText("I'm Ready")).toBeTruthy();
  });

  it('opens the Take a Selfie page when the user is ready', () => {
    useVerificationStore.setState({
      selectedId: 'National ID (PhilSys/PhilID)',
      captures: { front: FRONT_CAPTURE, back: BACK_CAPTURE },
    });
    render(<SelfiePrep />);

    fireEvent.press(screen.getByText("I'm Ready"));

    expect(mockPush).toHaveBeenCalledWith('/verify-account/upload-selfie');
  });

  it('redirects to ID selection without an active verification session', () => {
    render(<SelfiePrep />);

    expect(mockReplace).toHaveBeenCalledWith('/(auth)/verify-account/select-id');
  });

  it('redirects to Upload ID when one or more required ID captures are missing', () => {
    useVerificationStore.setState({
      selectedId: 'National ID (PhilSys/PhilID)',
      captures: { front: FRONT_CAPTURE },
    });
    render(<SelfiePrep />);

    expect(mockReplace).toHaveBeenCalledWith('/(auth)/verify-account/upload-id');
  });

  it('returns to the completed ID summary from its close control', () => {
    useVerificationStore.setState({
      selectedId: 'National ID (PhilSys/PhilID)',
      captures: { front: FRONT_CAPTURE, back: BACK_CAPTURE },
    });
    render(<SelfiePrep />);

    fireEvent.press(screen.getByTestId('close-button'));

    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
