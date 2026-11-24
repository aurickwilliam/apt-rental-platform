import { act, fireEvent, render, screen } from '@testing-library/react-native';

import UploadId from '@/app/(auth)/verify-account/upload-id';
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

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockUseFocusEffect = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack, replace: mockReplace }),
  useFocusEffect: (callback: () => void) => mockUseFocusEffect(callback),
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

const FRONT_CAPTURE = { uri: 'file://front.jpg', width: 100, height: 63 };
const BACK_CAPTURE = { uri: 'file://back.jpg', width: 100, height: 63 };
const SELFIE_CAPTURE = { uri: 'file://selfie.jpg', width: 100, height: 100 };
const AUTHENTICITY_DECLARATION = 'I confirm that the submitted ID is authentic, valid, and belongs to me.';

describe('UploadId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    latestImageViewingProps = null;
    mockUseFocusEffect.mockImplementation((callback: () => void) => {
      callback();
    });
    useVerificationStore.setState({ ...initialVerificationState });
  });

  describe('focus-aware automatic progression', () => {
    it('on first focused entry, opens the first card capture step', async () => {
      useVerificationStore.setState({ selectedId: 'National ID (PhilSys/PhilID)', captures: {} });
      await render(<UploadId />);

      expect(mockPush).toHaveBeenCalledWith(
        '/(auth)/verify-account/live-capture?idType=National%20ID%20(PhilSys%2FPhilID)&stepId=front',
      );
    });

    it('on first focused entry, opens Passport identity-page capture', async () => {
      useVerificationStore.setState({ selectedId: 'Passport', captures: {} });
      await render(<UploadId />);

      expect(mockPush).toHaveBeenCalledWith(
        '/(auth)/verify-account/live-capture?idType=Passport&stepId=identity-page',
      );
    });

    it('when focused with Front already complete, resumes at Back capture', async () => {
      useVerificationStore.setState({
        selectedId: 'National ID (PhilSys/PhilID)',
        captures: { front: FRONT_CAPTURE },
      });
      await render(<UploadId />);

      expect(mockPush).toHaveBeenCalledWith(
        '/(auth)/verify-account/live-capture?idType=National%20ID%20(PhilSys%2FPhilID)&stepId=back',
      );
    });

    it('does not route from an inactive summary screen until it receives focus', async () => {
      mockUseFocusEffect.mockImplementation(() => undefined);
      useVerificationStore.setState({
        selectedId: 'National ID (PhilSys/PhilID)',
        captures: { front: FRONT_CAPTURE },
      });
      await render(<UploadId />);

      expect(mockPush).not.toHaveBeenCalled();

      const latestFocusCallback = mockUseFocusEffect.mock.calls.at(-1)?.[0] as (() => void) | undefined;
      await act(() => latestFocusCallback?.());

      expect(mockPush).toHaveBeenCalledWith(
        '/(auth)/verify-account/live-capture?idType=National%20ID%20(PhilSys%2FPhilID)&stepId=back',
      );
    });

    it('does not open another camera route after every ID capture is complete', async () => {
      useVerificationStore.setState({
        selectedId: 'National ID (PhilSys/PhilID)',
        captures: { front: FRONT_CAPTURE, back: BACK_CAPTURE },
      });
      await render(<UploadId />);

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('null selectedId guard', () => {
    it('redirects to select-id and does not open live capture', async () => {
      await render(<UploadId />);

      expect(mockReplace).toHaveBeenCalledWith('/(auth)/verify-account/select-id');
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('completed ID summary', () => {
    it('renders read-only labeled previews and no manual capture or row-retake actions', async () => {
      useVerificationStore.setState({
        selectedId: 'National ID (PhilSys/PhilID)',
        captures: { front: FRONT_CAPTURE, back: BACK_CAPTURE },
      });
      await render(<UploadId />);

      expect(screen.getByText('Front:')).toBeTruthy();
      expect(screen.getByText('Back:')).toBeTruthy();
      expect(screen.getByLabelText('Front ID photo')).toBeTruthy();
      expect(screen.getByLabelText('Back ID photo')).toBeTruthy();
      expect(screen.queryByText('Capture with camera')).toBeNull();
      expect(screen.queryByText('Retake photo')).toBeNull();
    });

    it('renders the single Passport identity-page preview', async () => {
      useVerificationStore.setState({
        selectedId: 'Passport',
        captures: { 'identity-page': FRONT_CAPTURE },
      });
      await render(<UploadId />);

      expect(screen.getByText('Identity Page:')).toBeTruthy();
      expect(screen.getByLabelText('Identity Page ID photo')).toBeTruthy();
      expect(screen.queryByText('Front:')).toBeNull();
      expect(screen.queryByText('Back:')).toBeNull();
    });

    it('renders card images with explicit style sizing (not className-only)', async () => {
      useVerificationStore.setState({
        selectedId: 'National ID (PhilSys/PhilID)',
        captures: { front: FRONT_CAPTURE, back: BACK_CAPTURE },
      });
      await render(<UploadId />);

      for (const label of ['Front ID photo', 'Back ID photo']) {
        const image = screen.getByLabelText(label);
        expect(image.props.style).toEqual(
          expect.objectContaining({ width: '100%', height: 192 }),
        );
      }
    });

    it('only shows the authenticity declaration after the complete summary is available', async () => {      useVerificationStore.setState({
        selectedId: 'National ID (PhilSys/PhilID)',
        captures: { front: FRONT_CAPTURE },
      });
      const { rerender } = await render(<UploadId />);

      expect(screen.queryByText(AUTHENTICITY_DECLARATION)).toBeNull();
      expect(screen.queryByText('Retake ID Photos')).toBeNull();

      await act(() => {
        useVerificationStore.setState({
          captures: { front: FRONT_CAPTURE, back: BACK_CAPTURE },
        });
      });
      await rerender(<UploadId />);

      expect(screen.getByText(AUTHENTICITY_DECLARATION)).toBeTruthy();
      expect(screen.getByText('Retake ID Photos')).toBeTruthy();
    });
  });

  describe('fullscreen photo viewer', () => {
    it('tapping a captured photo opens the viewer on that photo', async () => {
      useVerificationStore.setState({
        selectedId: 'National ID (PhilSys/PhilID)',
        captures: { front: FRONT_CAPTURE, back: BACK_CAPTURE },
      });
      await render(<UploadId />);

      expect(screen.queryByTestId('image-viewer')).toBeNull();

      await fireEvent.press(screen.getByLabelText('View Back ID photo fullscreen'));

      expect(latestImageViewingProps.visible).toBe(true);
      expect(latestImageViewingProps.imageIndex).toBe(1);
      expect(latestImageViewingProps.images).toEqual([
        { uri: 'file://front.jpg' },
        { uri: 'file://back.jpg' },
      ]);
      expect(screen.getByTestId('image-viewer')).toBeTruthy();
      expect(screen.getByTestId('image-viewer-count')).toBeTruthy();
    });

    it('tapping the first captured photo opens the viewer on the first photo', async () => {
      useVerificationStore.setState({
        selectedId: 'National ID (PhilSys/PhilID)',
        captures: { front: FRONT_CAPTURE, back: BACK_CAPTURE },
      });
      await render(<UploadId />);

      await fireEvent.press(screen.getByLabelText('View Front ID photo fullscreen'));

      expect(latestImageViewingProps.visible).toBe(true);
      expect(latestImageViewingProps.imageIndex).toBe(0);
    });

    it('closing the viewer dismisses it', async () => {
      useVerificationStore.setState({
        selectedId: 'National ID (PhilSys/PhilID)',
        captures: { front: FRONT_CAPTURE, back: BACK_CAPTURE },
      });
      await render(<UploadId />);

      await fireEvent.press(screen.getByLabelText('View Front ID photo fullscreen'));
      expect(screen.getByTestId('image-viewer')).toBeTruthy();

      await fireEvent.press(screen.getByTestId('image-viewer-close'));
      expect(screen.queryByTestId('image-viewer')).toBeNull();
    });

    it('shows the single Passport photo in the viewer', async () => {
      useVerificationStore.setState({
        selectedId: 'Passport',
        captures: { 'identity-page': FRONT_CAPTURE },
      });
      await render(<UploadId />);

      await fireEvent.press(screen.getByLabelText('View Identity Page ID photo fullscreen'));

      expect(latestImageViewingProps.visible).toBe(true);
      expect(latestImageViewingProps.images).toEqual([{ uri: 'file://front.jpg' }]);
    });

    it('shows a retake hint instead of a blank card when a photo fails to load', async () => {
      useVerificationStore.setState({
        selectedId: 'National ID (PhilSys/PhilID)',
        captures: { front: FRONT_CAPTURE, back: BACK_CAPTURE },
      });
      await render(<UploadId />);

      await fireEvent(screen.getByLabelText('Front ID photo'), 'error');

      expect(screen.getByText(/Photo couldn't load/i)).toBeTruthy();
      expect(screen.queryByLabelText('View Front ID photo fullscreen')).toBeNull();
      // The other card is unaffected.
      expect(screen.getByLabelText('View Back ID photo fullscreen')).toBeTruthy();
    });
  });

  describe('authenticity declaration and retake', () => {
    it('enables Continue to Selfie only after the completed summary declaration is selected', async () => {
      useVerificationStore.setState({
        selectedId: 'National ID (PhilSys/PhilID)',
        captures: { front: FRONT_CAPTURE, back: BACK_CAPTURE },
      });
      await render(<UploadId />);
      const disabledNodes = () => findAllInTree(screen.root!, (node) => node.props.disabled === true || node.props.accessibilityState?.disabled === true);

      expect(disabledNodes().length).toBeGreaterThan(0);

      await fireEvent.press(screen.getByText(AUTHENTICITY_DECLARATION));

      expect(disabledNodes()).toHaveLength(0);
    });

    it('routes completed and confirmed ID submissions to selfie preparation', async () => {
      useVerificationStore.setState({
        selectedId: 'National ID (PhilSys/PhilID)',
        captures: { front: FRONT_CAPTURE, back: BACK_CAPTURE },
      });
      await render(<UploadId />);

      await fireEvent.press(screen.getByText(AUTHENTICITY_DECLARATION));
      await fireEvent.press(screen.getByText('Continue to Selfie'));

      expect(mockPush).toHaveBeenCalledWith('/(auth)/verify-account/selfie-prep');
    });

    it('retakes the complete ID sequence by clearing ID captures, resetting confirmation, and reopening Front', async () => {
      useVerificationStore.setState({
        selectedId: 'National ID (PhilSys/PhilID)',
        captures: {
          front: FRONT_CAPTURE,
          back: BACK_CAPTURE,
          selfie: SELFIE_CAPTURE,
        },
      });
      await render(<UploadId />);

      await fireEvent.press(screen.getByText(AUTHENTICITY_DECLARATION));
      await fireEvent.press(screen.getByText('Retake ID Photos'));

      expect(useVerificationStore.getState().selectedId).toBe('National ID (PhilSys/PhilID)');
      expect(useVerificationStore.getState().captures).toEqual({ selfie: SELFIE_CAPTURE });
      expect(mockPush).toHaveBeenCalledWith(
        '/(auth)/verify-account/live-capture?idType=National%20ID%20(PhilSys%2FPhilID)&stepId=front',
      );
      expect(screen.queryByText(AUTHENTICITY_DECLARATION)).toBeNull();
    });
  });

  describe('absence of removed format/picker UI', () => {
    it('renders no format selector, document uploader, gallery, or file picker affordance', async () => {
      useVerificationStore.setState({
        selectedId: 'National ID (PhilSys/PhilID)',
        captures: { front: FRONT_CAPTURE, back: BACK_CAPTURE },
      });
      await render(<UploadId />);

      expect(screen.queryByText('Physical ID')).toBeNull();
      expect(screen.queryByText('Digital Document')).toBeNull();
      expect(screen.queryByText('Choose photo')).toBeNull();
      expect(screen.queryByText('Choose file')).toBeNull();
      expect(screen.queryByText('Add document')).toBeNull();
    });
  });
});
