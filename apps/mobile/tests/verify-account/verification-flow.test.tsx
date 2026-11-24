import { act, fireEvent, render, screen } from '@testing-library/react-native';

import SelectId from '@/app/(auth)/verify-account/select-id';
import UploadId from '@/app/(auth)/verify-account/upload-id';
import SelfiePrep from '@/app/(auth)/verify-account/selfie-prep';
import UploadSelfie from '@/app/(auth)/verify-account/upload-selfie';
import { findAllInTree } from '../support/testTraversal';
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

const disabledNodes = () =>
  findAllInTree(screen.root!, (node) => node.props.disabled === true || node.props.accessibilityState?.disabled === true);

describe('verification flow (integration)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useVerificationStore.setState({ ...initialVerificationState });
  });

  it('walks the happy path: select-id → upload-id auto-forward → capture all steps → confirm → selfie → submit', async () => {
    // --- select-id: picking an ID starts a fresh session and pushes upload-id
    useVerificationStore.setState({
      selectedId: 'Passport',
      captures: { front: captureResult('file://stale.jpg') },
    });
    await render(<SelectId />);

    await fireEvent.press(screen.getByText('National ID (PhilSys/PhilID)'));

    expect(useVerificationStore.getState().selectedId).toBe('National ID (PhilSys/PhilID)');
    expect(useVerificationStore.getState().captures).toEqual({});
    expect(mockPush).toHaveBeenCalledWith('/(auth)/verify-account/upload-id');

    await screen.unmount();

    // --- upload-id: fresh session auto-forwards to the first capture step
    await render(<UploadId />);

    expect(mockPush).toHaveBeenCalledWith(
      '/(auth)/verify-account/live-capture?idType=National%20ID%20(PhilSys%2FPhilID)&stepId=front',
    );

    // --- simulate what live-capture writes on "Use Photo" for each step
    await act(() => {
      useVerificationStore.getState().setCaptureResult('front', captureResult('file://front.jpg'));
      useVerificationStore.getState().setCaptureResult('back', captureResult('file://back.jpg'));
    });

    // Still locked until the confirmation checkbox is pressed.
    expect(disabledNodes().length).toBeGreaterThan(0);

    await fireEvent.press(screen.getByText(/I confirm/));
    expect(disabledNodes()).toHaveLength(0);

    await fireEvent.press(screen.getByText('Continue to Selfie'));
    expect(mockPush).toHaveBeenCalledWith('/(auth)/verify-account/selfie-prep');

    await screen.unmount();

    // --- selfie-prep: completed IDs are required and "I'm Ready" opens the selfie page
    await render(<SelfiePrep />);

    expect(screen.getByText('Get ready for your selfie')).toBeTruthy();
    await fireEvent.press(screen.getByText("I'm Ready"));
    expect(mockPush).toHaveBeenCalledWith('/(auth)/verify-account/upload-selfie');

    await screen.unmount();

    // --- upload-selfie: guards pass (ID steps complete), capture selfie, submit
    await render(<UploadSelfie />);

    expect(mockReplace).not.toHaveBeenCalled();
    expect(screen.getByText('Review & Submit')).toBeTruthy();
    expect(disabledNodes().length).toBeGreaterThan(0);

    await fireEvent.press(screen.getByText('Capture Selfie'));
    expect(mockPush).toHaveBeenCalledWith('/(auth)/verify-account/live-capture?stepId=selfie');

    await act(() => {
      useVerificationStore.getState().setCaptureResult('selfie', captureResult('file://selfie.jpg', 200, 200));
    });

    expect(disabledNodes()).toHaveLength(0);

    await fireEvent.press(screen.getByText('Review & Submit'));
    expect(mockPush).toHaveBeenCalledWith('/(auth)/verify-account/review');

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

  it('upload-selfie with no selectedId redirects to select-id instead of rendering', async () => {
    useVerificationStore.setState({ selectedId: null, captures: {} });
    await render(<UploadSelfie />);

    expect(mockReplace).toHaveBeenCalledWith('/(auth)/verify-account/select-id');
  });

  it('upload-selfie with incomplete ID captures redirects to upload-id', async () => {
    useVerificationStore.setState({
      selectedId: 'National ID (PhilSys/PhilID)',
      captures: { front: captureResult('file://front.jpg') },
    });
    await render(<UploadSelfie />);

    expect(mockReplace).toHaveBeenCalledWith('/(auth)/verify-account/upload-id');
  });

  it('upload-selfie back button returns to the previous screen', async () => {
    useVerificationStore.setState({
      selectedId: 'National ID (PhilSys/PhilID)',
      captures: {
        front: captureResult('file://front.jpg'),
        back: captureResult('file://back.jpg'),
      },
    });
    await render(<UploadSelfie />);

    await fireEvent.press(screen.getByTestId('close-button'));

    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  describe('upload-selfie automatic camera forward', () => {
    it('opens the selfie camera on focused entry without a stored selfie', async () => {
      useVerificationStore.setState({
        selectedId: 'National ID (PhilSys/PhilID)',
        captures: {
          front: captureResult('file://front.jpg'),
          back: captureResult('file://back.jpg'),
        },
      });
      await render(<UploadSelfie />);

      expect(mockPush).toHaveBeenCalledWith('/(auth)/verify-account/live-capture?stepId=selfie');
    });

    it('does not reopen the camera once a selfie is stored', async () => {
      useVerificationStore.setState({
        selectedId: 'National ID (PhilSys/PhilID)',
        captures: {
          front: captureResult('file://front.jpg'),
          back: captureResult('file://back.jpg'),
          selfie: captureResult('file://selfie.jpg', 200, 200),
        },
      });
      await render(<UploadSelfie />);

      expect(mockPush).not.toHaveBeenCalled();
    });

    it('does not open the camera when redirecting an invalid session', async () => {
      useVerificationStore.setState({ selectedId: null, captures: {} });
      await render(<UploadSelfie />);

      expect(mockPush).not.toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/(auth)/verify-account/select-id');
    });
  });
});