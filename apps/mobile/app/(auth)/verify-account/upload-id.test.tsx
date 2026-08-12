import { fireEvent, render, screen } from '@testing-library/react-native';

import UploadId from './upload-id';
import { useVerificationStore, initialVerificationState } from '@/stores/useVerificationStore';

jest.mock('@/hooks/useTheme', () => ({
  useColors: () => ({
    colors: { textPrimary: '#333333', primary: '#376BF5', white: '#FFFFFF' },
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

// heroui-native ESM stub, matching the convention used elsewhere.
jest.mock('heroui-native', () => {
  const { View, Text, TouchableOpacity } = require('react-native');

  const ButtonRoot = ({ children, onPress, isDisabled, ...rest }: any) => (
    <TouchableOpacity onPress={onPress} disabled={isDisabled} {...rest}>
      {children}
    </TouchableOpacity>
  );
  const ButtonLabel = ({ children }: any) => <Text>{children}</Text>;

  const Passthrough = ({ children, ...rest }: any) => <View {...rest}>{children}</View>;
  const TextPassthrough = ({ children, ...rest }: any) => <Text {...rest}>{children}</Text>;

  const ControlFieldRoot = ({ children, onSelectedChange }: any) => (
    <TouchableOpacity onPress={onSelectedChange}>{children}</TouchableOpacity>
  );

  return {
    Button: Object.assign(ButtonRoot, { Label: ButtonLabel }),
    CloseButton: ({ children, onPress }: any) => (
      <TouchableOpacity onPress={onPress}>{children}</TouchableOpacity>
    ),
    Checkbox: () => null,
    ControlField: Object.assign(ControlFieldRoot, { Indicator: Passthrough }),
    Label: Object.assign(Passthrough, { Text: TextPassthrough }),
  };
});

describe('UploadId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useVerificationStore.setState({ ...initialVerificationState });
  });

  describe('auto-forward on first entry (Req 1.1)', () => {
    it('with captures: {} and a non-null selectedId, mounting triggers router.push to live-capture for the first step', () => {
      useVerificationStore.setState({ selectedId: 'National ID (PhilSys/PhilID)', captures: {} });
      render(<UploadId />);

      expect(mockPush).toHaveBeenCalledWith(
        '/(auth)/verify-account/live-capture?idType=National%20ID%20(PhilSys%2FPhilID)&stepId=front',
      );
    });

    it('auto-forwards to the single identity-page step for Passport', () => {
      useVerificationStore.setState({ selectedId: 'Passport', captures: {} });
      render(<UploadId />);

      expect(mockPush).toHaveBeenCalledWith(
        '/(auth)/verify-account/live-capture?idType=Passport&stepId=identity-page',
      );
    });

    it('does NOT auto-forward once at least one (but not all) captures entries exist, and instead renders the progress rows', () => {
      useVerificationStore.setState({
        selectedId: 'National ID (PhilSys/PhilID)',
        captures: { front: { uri: 'file://front.jpg', width: 100, height: 63 } },
      });
      render(<UploadId />);

      expect(mockPush).not.toHaveBeenCalled();
      expect(screen.getByText('Front:')).toBeTruthy();
      expect(screen.getByText('Back:')).toBeTruthy();
    });
  });

  describe('null selectedId guard', () => {
    it('with a null selectedId (e.g. after the camera close button reset the session), mounting redirects to select-id and does not auto-forward to live-capture', () => {
      useVerificationStore.setState({ selectedId: null, captures: {} });
      render(<UploadId />);

      expect(mockReplace).toHaveBeenCalledWith('/(auth)/verify-account/select-id');
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('row rendering', () => {
    it('reflects correct complete/incomplete state for a mixed-progress captures map', () => {
      useVerificationStore.setState({
        selectedId: 'National ID (PhilSys/PhilID)',
        captures: { front: { uri: 'file://front.jpg', width: 100, height: 63 } },
      });
      render(<UploadId />);

      expect(screen.getByText('Retake photo')).toBeTruthy();
      expect(screen.getByText('Capture with camera')).toBeTruthy();
    });

    it('renders a single Identity Page row for Passport', () => {
      useVerificationStore.setState({
        selectedId: 'Passport',
        captures: { 'identity-page': { uri: 'file://id.jpg', width: 100, height: 71 } },
      });
      render(<UploadId />);

      expect(screen.getByText('Identity Page:')).toBeTruthy();
      expect(screen.queryByText('Front:')).toBeNull();
      expect(screen.queryByText('Back:')).toBeNull();
    });
  });

  describe('navigation', () => {
    it('tapping an incomplete row navigates to live-capture with the correct idType/stepId', () => {
      useVerificationStore.setState({
        selectedId: 'National ID (PhilSys/PhilID)',
        captures: { front: { uri: 'file://front.jpg', width: 100, height: 63 } },
      });
      render(<UploadId />);

      fireEvent.press(screen.getByText('Capture with camera'));

      expect(mockPush).toHaveBeenCalledWith(
        '/(auth)/verify-account/live-capture?idType=National%20ID%20(PhilSys%2FPhilID)&stepId=back',
      );
    });

    it('tapping a complete row (retake) navigates to live-capture with the correct idType/stepId', () => {
      useVerificationStore.setState({
        selectedId: 'National ID (PhilSys/PhilID)',
        captures: { front: { uri: 'file://front.jpg', width: 100, height: 63 } },
      });
      render(<UploadId />);

      fireEvent.press(screen.getByText('Retake photo'));

      expect(mockPush).toHaveBeenCalledWith(
        '/(auth)/verify-account/live-capture?idType=National%20ID%20(PhilSys%2FPhilID)&stepId=front',
      );
    });
  });

  describe('absence of removed format/picker UI', () => {
    it('renders no DocumentFormatSelector, UploadDocumentField, or gallery/file picker affordance', () => {
      useVerificationStore.setState({
        selectedId: 'National ID (PhilSys/PhilID)',
        captures: { front: { uri: 'file://front.jpg', width: 100, height: 63 } },
      });
      render(<UploadId />);

      expect(screen.queryByText('Physical ID')).toBeNull();
      expect(screen.queryByText('Digital Document')).toBeNull();
      expect(screen.queryByText('Choose photo')).toBeNull();
      expect(screen.queryByText('Choose file')).toBeNull();
      expect(screen.queryByText('Add document')).toBeNull();
    });
  });

  describe('continue gating', () => {
    it('Continue to Selfie is disabled while any capture step is missing', () => {
      useVerificationStore.setState({
        selectedId: 'National ID (PhilSys/PhilID)',
        captures: { front: { uri: 'file://front.jpg', width: 100, height: 63 } },
      });
      const { UNSAFE_getAllByProps } = render(<UploadId />);

      expect(UNSAFE_getAllByProps({ disabled: true }).length).toBeGreaterThan(0);
    });

    it('Continue to Selfie is enabled once every step is captured and the checkbox is confirmed', () => {
      useVerificationStore.setState({
        selectedId: 'National ID (PhilSys/PhilID)',
        captures: {
          front: { uri: 'file://front.jpg', width: 100, height: 63 },
          back: { uri: 'file://back.jpg', width: 100, height: 63 },
        },
      });
      const { UNSAFE_getAllByProps, UNSAFE_queryAllByProps } = render(<UploadId />);

      // Not yet confirmed — still disabled.
      expect(UNSAFE_getAllByProps({ disabled: true }).length).toBeGreaterThan(0);

      fireEvent.press(screen.getByText(/I confirm/));

      // All steps captured and confirmed — no longer disabled.
      expect(UNSAFE_queryAllByProps({ disabled: true })).toHaveLength(0);
    });
  });
});
