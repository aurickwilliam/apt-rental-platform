import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import Review from '@/app/(auth)/verify-account/review';
import { CARD_ASPECT_RATIO } from '@/app/(auth)/verify-account/constants/captureSequences';
import { initialVerificationState, useVerificationStore } from '@/stores/useVerificationStore';

jest.mock('@/hooks/useTheme', () => ({
  useColors: () => ({
    colors: {
      textPrimary: '#333333',
      primary: '#376BF5',
      success: '#22C55E',
      danger: '#E50914',
    },
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

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return {
    Image: ({ accessibilityLabel, ...props }: { accessibilityLabel?: string }) => (
      <View accessibilityLabel={accessibilityLabel} {...props} />
    ),
  };
});

let latestImageViewingProps: any = null;
jest.mock('react-native-image-viewing', () => (props: any) => {
  latestImageViewingProps = props;
  const { View, Text, TouchableOpacity } = require('react-native');
  if (!props.visible) return null;
  return (
    <View testID="image-viewer">
      <Text testID="image-viewer-count">
        {(props.imageIndex ?? 0) + 1} / {props.images.length}
      </Text>
      {props.images.map((image: { uri: string }) => (
        <View key={image.uri} testID={`viewer-image-${image.uri}`} />
      ))}
      <TouchableOpacity testID="image-viewer-close" onPress={props.onRequestClose} />
    </View>
  );
});

// HeroUI Native ESM stub, matching the convention used elsewhere.
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

  const DialogRoot = ({ children, isOpen }: any) => (isOpen ? <View>{children}</View> : null);

  return {
    Button: Object.assign(ButtonRoot, { Label: ButtonLabel }),
    CloseButton: ({ children, onPress }: any) => (
      <TouchableOpacity onPress={onPress}>{children}</TouchableOpacity>
    ),
    Card: Passthrough,
    Dialog: Object.assign(DialogRoot, {
      Portal: Passthrough,
      Overlay: () => null,
      Content: Passthrough,
      Close: () => null,
      Title: TextPassthrough,
      Description: TextPassthrough,
    }),
  };
});

const mockMutateAsync = jest.fn();
const mockBuildVerificationInput = jest.fn();
jest.mock('@/hooks/verification', () => ({
  useSubmitVerification: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
  buildVerificationInput: (...args: unknown[]) => mockBuildVerificationInput(...args),
}));

const FRONT_CAPTURE = { uri: 'file://front.jpg', width: 100, height: 63 };
const BACK_CAPTURE = { uri: 'file://back.jpg', width: 100, height: 63 };
const SELFIE_CAPTURE = { uri: 'file://selfie.jpg', width: 100, height: 100 };

const COMPLETE_STATE = {
  selectedId: 'National ID (PhilSys/PhilID)',
  captures: { front: FRONT_CAPTURE, back: BACK_CAPTURE, selfie: SELFIE_CAPTURE },
};

const BUILT_INPUT = {
  idType: 'National ID (PhilSys/PhilID)',
  idFront: FRONT_CAPTURE,
  idBack: BACK_CAPTURE,
  selfie: SELFIE_CAPTURE,
};

describe('Review', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    latestImageViewingProps = null;
    mockMutateAsync.mockResolvedValue({ id: 'verification-1' });
    mockBuildVerificationInput.mockReturnValue(BUILT_INPUT);
    useVerificationStore.setState({ ...initialVerificationState });
  });

  it('shows the ID type, ID previews, and selfie preview for a complete session', () => {
    useVerificationStore.setState({ ...COMPLETE_STATE });
    render(<Review />);

    expect(screen.getByText('National ID (PhilSys/PhilID)')).toBeTruthy();
    expect(screen.getByLabelText('ID Front photo')).toBeTruthy();
    expect(screen.getByLabelText('ID Back photo')).toBeTruthy();
    expect(screen.getByLabelText('Selfie holding your ID')).toBeTruthy();
    expect(screen.getByText('Submit for Verification')).toBeTruthy();
  });

  it('redirects to ID selection without an active verification session', () => {
    render(<Review />);

    expect(mockReplace).toHaveBeenCalledWith('/(auth)/verify-account/select-id');
  });

  it('redirects to Upload ID when required ID captures are missing', () => {
    useVerificationStore.setState({
      selectedId: 'National ID (PhilSys/PhilID)',
      captures: { front: FRONT_CAPTURE, selfie: SELFIE_CAPTURE },
    });
    render(<Review />);

    expect(mockReplace).toHaveBeenCalledWith('/(auth)/verify-account/upload-id');
  });

  it('redirects to the selfie step when the selfie is missing', () => {
    useVerificationStore.setState({
      selectedId: 'National ID (PhilSys/PhilID)',
      captures: { front: FRONT_CAPTURE, back: BACK_CAPTURE },
    });
    render(<Review />);

    expect(mockReplace).toHaveBeenCalledWith('/(auth)/verify-account/upload-selfie');
  });

  it('renders ID cards at ID proportions and the selfie card portrait', () => {
    useVerificationStore.setState({ ...COMPLETE_STATE });
    render(<Review />);

    for (const label of ['ID Front photo', 'ID Back photo']) {
      const image = screen.getByLabelText(label);
      expect(image.props.style.width).toBe('100%');
      expect(image.props.style.aspectRatio).toBeCloseTo(CARD_ASPECT_RATIO, 5);
    }

    const selfieImage = screen.getByLabelText('Selfie holding your ID');
    expect(selfieImage.props.style.width).toBe('100%');
    expect(selfieImage.props.style.aspectRatio).toBe(1);
  });

  it('reopens live-capture for the tapped document', () => {
    useVerificationStore.setState({ ...COMPLETE_STATE });
    render(<Review />);

    const retakeButtons = screen.getAllByText('Retake');
    fireEvent.press(retakeButtons[0]);

    expect(mockPush).toHaveBeenCalledWith(
      '/(auth)/verify-account/live-capture?idType=National%20ID%20(PhilSys%2FPhilID)&stepId=front',
    );
  });

  it('reopens the selfie camera from the selfie Retake action', () => {
    useVerificationStore.setState({ ...COMPLETE_STATE });
    render(<Review />);

    const retakeButtons = screen.getAllByText('Retake');
    fireEvent.press(retakeButtons[retakeButtons.length - 1]);

    expect(mockPush).toHaveBeenCalledWith('/(auth)/verify-account/live-capture?stepId=selfie');
  });

  it('tapping a photo opens the fullscreen viewer on that photo', () => {
    useVerificationStore.setState({ ...COMPLETE_STATE });
    render(<Review />);

    expect(screen.queryByTestId('image-viewer')).toBeNull();

    fireEvent.press(screen.getByLabelText('View ID Back photo fullscreen'));

    expect(latestImageViewingProps.visible).toBe(true);
    expect(latestImageViewingProps.imageIndex).toBe(1);
    expect(latestImageViewingProps.images).toEqual([
      { uri: 'file://front.jpg' },
      { uri: 'file://back.jpg' },
      { uri: 'file://selfie.jpg' },
    ]);
    expect(screen.getByTestId('image-viewer')).toBeTruthy();
  });

  it('tapping the selfie opens the viewer on the last photo', () => {
    useVerificationStore.setState({ ...COMPLETE_STATE });
    render(<Review />);

    fireEvent.press(screen.getByLabelText('View Selfie holding your ID fullscreen'));

    expect(latestImageViewingProps.visible).toBe(true);
    expect(latestImageViewingProps.imageIndex).toBe(2);
  });

  it('closing the viewer dismisses it', () => {
    useVerificationStore.setState({ ...COMPLETE_STATE });
    render(<Review />);

    fireEvent.press(screen.getByLabelText('View ID Front photo fullscreen'));
    expect(screen.getByTestId('image-viewer')).toBeTruthy();

    fireEvent.press(screen.getByTestId('image-viewer-close'));
    expect(screen.queryByTestId('image-viewer')).toBeNull();
  });

  it('shows a retake hint instead of a blank card when a photo fails to load', () => {
    useVerificationStore.setState({ ...COMPLETE_STATE });
    render(<Review />);

    fireEvent(screen.getByLabelText('ID Front photo'), 'error');

    expect(screen.getByText(/Photo couldn't load/i)).toBeTruthy();
    expect(screen.queryByLabelText('View ID Front photo fullscreen')).toBeNull();
    expect(screen.getByLabelText('View ID Back photo fullscreen')).toBeTruthy();
  });

  it('submits the built input and routes to the success screen', async () => {
    useVerificationStore.setState({ ...COMPLETE_STATE });
    render(<Review />);

    fireEvent.press(screen.getByText('Submit for Verification'));

    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalledWith(BUILT_INPUT));
    expect(mockPush).toHaveBeenCalledWith('/(auth)/verify-account/success');
  });

  it('shows the submission error without navigating when the upload fails', async () => {
    mockMutateAsync.mockRejectedValue(new Error('You already have a verification under review.'));
    useVerificationStore.setState({ ...COMPLETE_STATE });
    render(<Review />);

    fireEvent.press(screen.getByText('Submit for Verification'));

    await waitFor(() =>
      expect(
        screen.getByText('You already have a verification under review.'),
      ).toBeTruthy(),
    );
    expect(mockPush).not.toHaveBeenCalledWith('/(auth)/verify-account/success');
  });
});
