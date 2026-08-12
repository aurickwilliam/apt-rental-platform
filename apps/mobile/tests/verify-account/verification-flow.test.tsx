import { act, fireEvent, render, screen } from '@testing-library/react-native';

import SelectId from '@/app/(auth)/verify-account/select-id';
import UploadId from '@/app/(auth)/verify-account/upload-id';
import SelfiePrep from '@/app/(auth)/verify-account/selfie-prep';
import UploadSelfie from '@/app/(auth)/verify-account/upload-selfie';
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

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return { Image: (props: any) => <View {...props} /> };
});

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockDismissTo = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack, replace: mockReplace, dismissTo: mockDismissTo }),
  useFocusEffect: (callback: () => void) => callback(),
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

  const ListItemRoot = ({ children, onPress }: any) => (
    <TouchableOpacity onPress={onPress}>{children}</TouchableOpacity>
  );

  return {
    Button: Object.assign(ButtonRoot, { Label: ButtonLabel }),
    CloseButton: ({ children, onPress }: any) => (
      <TouchableOpacity testID="close-button" onPress={onPress}>{children}</TouchableOpacity>
    ),
    Checkbox: () => null,
    ControlField: Object.assign(ControlFieldRoot, { Indicator: Passthrough }),
    Label: Object.assign(Passthrough, { Text: TextPassthrough }),
    ListGroup: Object.assign(Passthrough, {
      Item: ListItemRoot,
      ItemContent: Passthrough,
      ItemTitle: TextPassthrough,
      ItemSuffix: () => null,
    }),
    Separator: () => null,
  };
});

const captureResult = (uri: string, width = 100, height = 63) => ({ uri, width, height });

describe('verification flow (integration)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useVerificationStore.setState({ ...initialVerificationState });
  });

  it('walks the happy path: select-id → upload-id auto-forward → capture all steps → confirm → selfie → submit', () => {
    // --- select-id: picking an ID starts a fresh session and pushes upload-id
    useVerificationStore.setState({
      selectedId: 'Passport',
      captures: { front: captureResult('file://stale.jpg') },
    });
    render(<SelectId />);

    fireEvent.press(screen.getByText('National ID (PhilSys/PhilID)'));

    expect(useVerificationStore.getState().selectedId).toBe('National ID (PhilSys/PhilID)');
    expect(useVerificationStore.getState().captures).toEqual({});
    expect(mockPush).toHaveBeenCalledWith('/(auth)/verify-account/upload-id');

    screen.unmount();

    // --- upload-id: fresh session auto-forwards to the first capture step
    render(<UploadId />);

    expect(mockPush).toHaveBeenCalledWith(
      '/(auth)/verify-account/live-capture?idType=National%20ID%20(PhilSys%2FPhilID)&stepId=front',
    );

    // --- simulate what live-capture writes on "Use Photo" for each step
    act(() => {
      useVerificationStore.getState().setCaptureResult('front', captureResult('file://front.jpg'));
      useVerificationStore.getState().setCaptureResult('back', captureResult('file://back.jpg'));
    });

    // Still locked until the confirmation checkbox is pressed.
    expect(screen.UNSAFE_getAllByProps({ disabled: true }).length).toBeGreaterThan(0);

    fireEvent.press(screen.getByText(/I confirm/));
    expect(screen.UNSAFE_queryAllByProps({ disabled: true })).toHaveLength(0);

    fireEvent.press(screen.getByText('Continue to Selfie'));
    expect(mockPush).toHaveBeenCalledWith('/verify-account/selfie-prep');

    screen.unmount();

    // --- selfie-prep: completed IDs are required and "I'm Ready" opens the selfie page
    render(<SelfiePrep />);

    expect(screen.getByText('Get ready for your selfie')).toBeTruthy();
    fireEvent.press(screen.getByText("I'm Ready"));
    expect(mockPush).toHaveBeenCalledWith('/verify-account/upload-selfie');

    screen.unmount();

    // --- upload-selfie: guards pass (ID steps complete), capture selfie, submit
    render(<UploadSelfie />);

    expect(mockReplace).not.toHaveBeenCalled();
    expect(screen.getByText('Submit Verification')).toBeTruthy();
    expect(screen.UNSAFE_getAllByProps({ disabled: true }).length).toBeGreaterThan(0);

    fireEvent.press(screen.getByText('Capture Selfie'));
    expect(mockPush).toHaveBeenCalledWith('/(auth)/verify-account/live-capture?stepId=selfie');

    act(() => {
      useVerificationStore.getState().setCaptureResult('selfie', captureResult('file://selfie.jpg', 200, 200));
    });

    expect(screen.UNSAFE_queryAllByProps({ disabled: true })).toHaveLength(0);

    fireEvent.press(screen.getByText('Submit Verification'));
    expect(mockPush).toHaveBeenCalledWith('/verify-account/success');

    expect(useVerificationStore.getState()).toEqual(
      expect.objectContaining({
        selectedId: 'National ID (PhilSys/PhilID)',
        captures: {
          front: captureResult('file://front.jpg'),
          back: captureResult('file://back.jpg'),
          selfie: captureResult('file://selfie.jpg', 200, 200),
        },
      }),
    );
  });

  it('upload-selfie with no selectedId redirects to select-id instead of rendering', () => {
    useVerificationStore.setState({ selectedId: null, captures: {} });
    render(<UploadSelfie />);

    expect(mockReplace).toHaveBeenCalledWith('/(auth)/verify-account/select-id');
  });

  it('upload-selfie with incomplete ID captures redirects to upload-id', () => {
    useVerificationStore.setState({
      selectedId: 'National ID (PhilSys/PhilID)',
      captures: { front: captureResult('file://front.jpg') },
    });
    render(<UploadSelfie />);

    expect(mockReplace).toHaveBeenCalledWith('/(auth)/verify-account/upload-id');
  });

  it('upload-selfie back button returns to the previous screen', () => {
    useVerificationStore.setState({
      selectedId: 'National ID (PhilSys/PhilID)',
      captures: {
        front: captureResult('file://front.jpg'),
        back: captureResult('file://back.jpg'),
      },
    });
    render(<UploadSelfie />);

    fireEvent.press(screen.getByTestId('close-button'));

    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});