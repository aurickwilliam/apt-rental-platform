import { act, fireEvent, render, screen } from '@testing-library/react-native';

import LiveCapture from '@/app/(auth)/verify-account/live-capture';
import { useVerificationStore, initialVerificationState } from '@/stores/useVerificationStore';
import { useCameraPermission } from '@/hooks/verification';
import { CARD_ASPECT_RATIO, PASSPORT_ASPECT_RATIO, SELFIE_STEP } from '@/app/(auth)/verify-account/constants/captureSequences';
import { computeGuidedFrameRect } from '@/components/display/GuidedFrameOverlay';
import { mapGuidedRectToImageCrop } from '@/app/(auth)/verify-account/utils/cropToFrame';

jest.mock('@/hooks/useTheme', () => ({
  useColors: () => ({
    colors: { white: '#FFFFFF', textPrimary: '#333333', primary: '#376BF5', success: '#22C55E' },
    isDark: false,
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockDismissTo = jest.fn();
let mockSearchParams: { idType?: string; stepId?: string } = { idType: 'National ID (PhilSys/PhilID)', stepId: 'front' };
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, push: jest.fn(), replace: mockReplace, dismissTo: mockDismissTo }),
  useLocalSearchParams: jest.fn(() => mockSearchParams),
}));

jest.mock('@/hooks/verification', () => ({
  useCameraPermission: jest.fn(),
}));

// Capture the onCameraReady/onMountError callbacks passed to CameraView so
// tests can simulate camera lifecycle events, and expose a mock
// takePictureAsync via the ref.
let latestCameraProps: any = null;
let mockTakePictureAsync = jest.fn();

jest.mock('expo-camera', () => {
  const React = require('react');
  const { View } = require('react-native');

  const CameraView = React.forwardRef((props: any, ref: any) => {
    latestCameraProps = props;
    React.useImperativeHandle(ref, () => ({
      takePictureAsync: mockTakePictureAsync,
    }));
    return <View testID="camera-view" />;
  });
  CameraView.displayName = 'CameraView';

  return { CameraView };
});

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return { Image: (props: any) => <View testID="captured-image-preview" {...props} /> };
});

const mockManipulate = jest.fn();
const mockCropAction = jest.fn();
const mockRenderAsync = jest.fn();
const mockSaveAsync = jest.fn();

jest.mock('expo-image-manipulator', () => ({
  SaveFormat: { JPEG: 'jpeg' },
  ImageManipulator: {
    manipulate: (...args: any[]) => mockManipulate(...args),
  },
}));

// heroui-native ESM stub, matching the convention used elsewhere.
jest.mock('heroui-native', () => {
  const { Text, TouchableOpacity } = require('react-native');

  const ButtonRoot = ({ children, onPress, isDisabled, ...rest }: any) => (
    <TouchableOpacity onPress={onPress} disabled={isDisabled} {...rest}>
      {children}
    </TouchableOpacity>
  );
  const ButtonLabel = ({ children }: any) => <Text>{children}</Text>;

  return {
    Button: Object.assign(ButtonRoot, { Label: ButtonLabel }),
    CloseButton: ({ children, onPress }: any) => (
      <TouchableOpacity testID="close-button" onPress={onPress}>{children}</TouchableOpacity>
    ),
  };
});

// Capture the props passed to GuidedFrameOverlay so tests can assert on the
// resolved aspectRatio, while keeping the component lightweight.
let latestGuidedFrameProps: any = null;
jest.mock('@/components/display/GuidedFrameOverlay', () => {
  const actual = jest.requireActual('@/components/display/GuidedFrameOverlay');
  const { View } = require('react-native');
  return {
    __esModule: true,
    ...actual,
    default: (props: any) => {
      latestGuidedFrameProps = props;
      return <View testID="guided-frame-overlay" />;
    },
  };
});

function setPermission(state: 'granted' | 'denied' | 'restricted' | 'undetermined') {
  (useCameraPermission as jest.Mock).mockReturnValue({
    state,
    requestPermission: jest.fn().mockResolvedValue(undefined),
    openSettings: jest.fn(),
  });
}

describe('LiveCapture', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    latestCameraProps = null;
    latestGuidedFrameProps = null;
    mockSearchParams = { idType: 'National ID (PhilSys/PhilID)', stepId: 'front' };
    mockTakePictureAsync = jest.fn().mockResolvedValue({ uri: 'file://captured.jpg', width: 400, height: 252 });
    mockManipulate.mockReturnValue({ crop: mockCropAction, renderAsync: mockRenderAsync });
    mockRenderAsync.mockResolvedValue({ saveAsync: mockSaveAsync });
    mockSaveAsync.mockResolvedValue({ uri: 'file://cropped.jpg', width: 200, height: 126 });
    useVerificationStore.setState({ ...initialVerificationState });
  });

  describe('permission branches', () => {
    it('denied → renders explanation and a settings-link control (Req 4.1)', () => {
      setPermission('denied');
      render(<LiveCapture />);

      expect(screen.getByText(/Camera access is required/i)).toBeTruthy();
      expect(screen.getByText('Open Settings')).toBeTruthy();
    });

    it('tapping the settings control calls openSettings (Req 4.2)', () => {
      const openSettings = jest.fn();
      (useCameraPermission as jest.Mock).mockReturnValue({
        state: 'denied',
        requestPermission: jest.fn(),
        openSettings,
      });
      render(<LiveCapture />);

      fireEvent.press(screen.getByText('Open Settings'));

      expect(openSettings).toHaveBeenCalledTimes(1);
    });

    it('restricted → renders explanation with no settings-link control (Req 4.6)', () => {
      setPermission('restricted');
      render(<LiveCapture />);

      expect(screen.getByText(/blocked by device policy/i)).toBeTruthy();
      expect(screen.queryByText('Open Settings')).toBeNull();
    });

    it('undetermined → requestPermission is called automatically on mount (Req 4.4)', () => {
      const requestPermission = jest.fn().mockResolvedValue(undefined);
      (useCameraPermission as jest.Mock).mockReturnValue({
        state: 'undetermined',
        requestPermission,
        openSettings: jest.fn(),
      });
      render(<LiveCapture />);

      expect(requestPermission).toHaveBeenCalled();
    });

    it('granted → renders the camera preview', () => {
      setPermission('granted');
      render(<LiveCapture />);

      expect(screen.getByTestId('camera-view')).toBeTruthy();
    });
  });

  describe('capture step resolution (Req 3.2)', () => {
    it('a card stepId uses the rear camera and rectangular CARD_ASPECT_RATIO guide', () => {
      setPermission('granted');
      mockSearchParams = { idType: 'National ID (PhilSys/PhilID)', stepId: 'front' };
      render(<LiveCapture />);

      expect(latestCameraProps.facing).toBe('back');
      expect(latestGuidedFrameProps.aspectRatio).toBeCloseTo(CARD_ASPECT_RATIO);
      expect(latestGuidedFrameProps.shape).toBe('rectangle');
    });

    it('a Passport stepId (identity-page) resolves to PASSPORT_ASPECT_RATIO for the guided frame', () => {
      setPermission('granted');
      mockSearchParams = { idType: 'Passport', stepId: 'identity-page' };
      render(<LiveCapture />);

      expect(latestGuidedFrameProps.aspectRatio).toBeCloseTo(PASSPORT_ASPECT_RATIO);
      expect(latestGuidedFrameProps.aspectRatio).not.toBeCloseTo(CARD_ASPECT_RATIO, 2);
    });

    it('a stepId not present in the resolved sequence renders the "capture step could not be found" error view instead of crashing', () => {
      setPermission('granted');
      mockSearchParams = { idType: 'National ID (PhilSys/PhilID)', stepId: 'nonexistent-step' };
      render(<LiveCapture />);

      expect(screen.getByText(/capture step could not be found/i)).toBeTruthy();
      expect(screen.queryByTestId('camera-view')).toBeNull();
    });

    it('the reserved selfie step uses the front camera with a circular success guide', () => {
      setPermission('granted');
      mockSearchParams = { stepId: SELFIE_STEP.id };
      render(<LiveCapture />);

      expect(latestCameraProps.facing).toBe('front');
      expect(latestGuidedFrameProps.aspectRatio).toBe(1);
      expect(latestGuidedFrameProps.shape).toBe('circle');
      expect(latestGuidedFrameProps.strokeColor).toBe('#22C55E');
      expect(screen.getByTestId('camera-view')).toBeTruthy();
      expect(screen.getByText(/position your face within the frame/i)).toBeTruthy();
    });
  });

  describe('static framing hint', () => {
    it('ID steps show the ID framing hint above the shutter', () => {
      setPermission('granted');
      mockSearchParams = { idType: 'National ID (PhilSys/PhilID)', stepId: 'front' };
      render(<LiveCapture />);

      expect(screen.getByText('Fit the entire ID inside the frame')).toBeTruthy();
    });

    it('the selfie step shows the face framing hint above the shutter', () => {
      setPermission('granted');
      mockSearchParams = { stepId: SELFIE_STEP.id };
      render(<LiveCapture />);

      expect(screen.getByText('Fit your face inside the circle')).toBeTruthy();
    });
  });

  describe('camera error handling (Req 3.9)', () => {
    it('onMountError renders an error message and a retry control', () => {
      setPermission('granted');
      render(<LiveCapture />);

      act(() => {
        latestCameraProps.onMountError({ message: 'Camera session failed' });
      });

      expect(screen.getByText(/Camera session failed/i)).toBeTruthy();
      expect(screen.getByText('Retry')).toBeTruthy();
    });

    it('tapping Retry remounts the camera view (error clears, preview renders again)', () => {
      setPermission('granted');
      render(<LiveCapture />);

      act(() => {
        latestCameraProps.onMountError({ message: 'Camera session failed' });
      });
      expect(screen.queryByTestId('camera-view')).toBeNull();

      fireEvent.press(screen.getByText('Retry'));

      expect(screen.getByTestId('camera-view')).toBeTruthy();
      expect(screen.queryByText(/Camera session failed/i)).toBeNull();
    });
  });

  describe('manual shutter only (Req 3.4, 3.5)', () => {
    it('manual shutter capture calls takePictureAsync', async () => {
      setPermission('granted');
      render(<LiveCapture />);

      act(() => {
        latestCameraProps.onCameraReady();
      });

      await act(async () => {
        fireEvent.press(screen.getByLabelText('Capture photo'));
        await Promise.resolve();
      });

      expect(mockTakePictureAsync).toHaveBeenCalledTimes(1);
    });

    it('preview never captures on its own — only the manual shutter does', async () => {
      setPermission('granted');

      render(<LiveCapture />);

      act(() => {
        latestCameraProps.onCameraReady();
      });

      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(mockTakePictureAsync).not.toHaveBeenCalled();

      await act(async () => {
        fireEvent.press(screen.getByLabelText('Capture photo'));
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(mockTakePictureAsync).toHaveBeenCalledTimes(1);
    });

    it('crops the capture to the guided frame measured from the preview layout', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
      try {
        setPermission('granted');
        mockSearchParams = { idType: 'National ID (PhilSys/PhilID)', stepId: 'front' };
        render(<LiveCapture />);

        act(() => {
          latestCameraProps.onCameraReady();
        });

        fireEvent(screen.getByTestId('camera-preview-container'), 'layout', {
          nativeEvent: { layout: { width: 400, height: 800 } },
        });

        await act(async () => {
          fireEvent.press(screen.getByLabelText('Capture photo'));
          await Promise.resolve();
          await Promise.resolve();
        });

        const expectedFrame = computeGuidedFrameRect(400, 800, CARD_ASPECT_RATIO);
        const expectedRegion = mapGuidedRectToImageCrop(expectedFrame, 400, 800, 400, 252);
        expect(mockCropAction).toHaveBeenCalledTimes(1);
        expect(mockCropAction).toHaveBeenCalledWith(expectedRegion);
        expect(mockSaveAsync).toHaveBeenCalledTimes(1);
        expect(consoleLogSpy).toHaveBeenCalledWith(
          'ID capture crop mapping.',
          expect.objectContaining({
            viewWidth: 400,
            viewHeight: 800,
            photoWidth: 400,
            photoHeight: 252,
            frame: expectedFrame,
            region: expectedRegion,
            croppedWidth: 200,
            croppedHeight: 126,
          }),
        );
      } finally {
        consoleLogSpy.mockRestore();
      }
    });

    it('falls back to the uncropped photo when the frame crop fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
      try {
        setPermission('granted');
        mockSaveAsync.mockRejectedValueOnce(new Error('crop failed'));
        render(<LiveCapture />);

        act(() => {
          latestCameraProps.onCameraReady();
        });

        await act(async () => {
          fireEvent.press(screen.getByLabelText('Capture photo'));
          await Promise.resolve();
          await Promise.resolve();
        });

        expect(screen.getByTestId('captured-image-preview')).toBeTruthy();
        expect(mockTakePictureAsync).toHaveBeenCalledTimes(1);
        expect(consoleErrorSpy).toHaveBeenCalled();

        fireEvent.press(screen.getByText('Use Photo'));

        expect(useVerificationStore.getState().captures.front).toEqual({
          uri: 'file://captured.jpg',
          width: 400,
          height: 252,
        });
      } finally {
        consoleErrorSpy.mockRestore();
      }
    });

    it('capture attempted before onCameraReady fires is a graceful no-op', async () => {
      setPermission('granted');
      render(<LiveCapture />);

      await act(async () => {
        fireEvent.press(screen.getByLabelText('Capture photo'));
        await Promise.resolve();
      });

      expect(mockTakePictureAsync).not.toHaveBeenCalled();
    });

    it('rapid double-invocation of the shutter results in only one takePictureAsync call', async () => {
      setPermission('granted');
      let resolveCapture: (value: any) => void = () => {};
      mockTakePictureAsync.mockImplementation(
        () => new Promise((resolve) => { resolveCapture = resolve; }),
      );
      render(<LiveCapture />);

      act(() => {
        latestCameraProps.onCameraReady();
      });

      await act(async () => {
        fireEvent.press(screen.getByLabelText('Capture photo'));
        fireEvent.press(screen.getByLabelText('Capture photo'));
        await Promise.resolve();
      });

      expect(mockTakePictureAsync).toHaveBeenCalledTimes(1);

      await act(async () => {
        resolveCapture({ uri: 'file://captured.jpg', width: 400, height: 252 });
        await Promise.resolve();
      });
    });

    it('a rejected takePictureAsync surfaces the error/retry UI state', async () => {
      setPermission('granted');
      mockTakePictureAsync.mockRejectedValue(new Error('Capture failed'));
      render(<LiveCapture />);

      act(() => {
        latestCameraProps.onCameraReady();
      });

      await act(async () => {
        fireEvent.press(screen.getByLabelText('Capture photo'));
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(screen.getByText(/Capture failed/i)).toBeTruthy();
      expect(screen.getByText('Retry')).toBeTruthy();
    });
  });

  describe('capture review (Req 3.6, 3.7, 3.8)', () => {
    async function captureAndReachReview() {
      setPermission('granted');
      render(<LiveCapture />);

      act(() => {
        latestCameraProps.onCameraReady();
      });

      await act(async () => {
        fireEvent.press(screen.getByLabelText('Capture photo'));
        await Promise.resolve();
        await Promise.resolve();
      });
    }

    it('displays the captured image with Retake and Use Photo actions after capture', async () => {
      await captureAndReachReview();

      expect(screen.getByTestId('captured-image-preview')).toBeTruthy();
      expect(screen.getByText('Retake')).toBeTruthy();
      expect(screen.getByText('Use Photo')).toBeTruthy();
    });

    it('Retake discards the captured image and returns to the camera preview', async () => {
      await captureAndReachReview();

      fireEvent.press(screen.getByText('Retake'));

      expect(screen.queryByTestId('captured-image-preview')).toBeNull();
      expect(screen.getByTestId('camera-view')).toBeTruthy();
    });

    it('Retake does not trigger an automatic capture — the user must press the shutter again', async () => {
      setPermission('granted');

      render(<LiveCapture />);
      act(() => {
        latestCameraProps.onCameraReady();
      });

      await act(async () => {
        fireEvent.press(screen.getByLabelText('Capture photo'));
        await Promise.resolve();
        await Promise.resolve();
      });
      expect(mockTakePictureAsync).toHaveBeenCalledTimes(1);

      fireEvent.press(screen.getByText('Retake'));

      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });
      expect(mockTakePictureAsync).toHaveBeenCalledTimes(1);
    });

    it('Use Photo commits the expected IdCaptureResult and replaces Front with Back capture', async () => {
      mockSearchParams = { idType: 'National ID (PhilSys/PhilID)', stepId: 'front' };
      await captureAndReachReview();

      fireEvent.press(screen.getByText('Use Photo'));

      expect(useVerificationStore.getState().captures.front).toEqual({
        uri: 'file://cropped.jpg',
        width: 200,
        height: 126,
      });
      expect(mockReplace).toHaveBeenCalledWith(
        '/(auth)/verify-account/live-capture?idType=National%20ID%20(PhilSys%2FPhilID)&stepId=back',
      );
      expect(mockBack).not.toHaveBeenCalled();
    });

    it('Use Photo returns to the ID summary after the final Back step', async () => {
      mockSearchParams = { idType: 'National ID (PhilSys/PhilID)', stepId: 'back' };
      await captureAndReachReview();

      fireEvent.press(screen.getByText('Use Photo'));

      expect(useVerificationStore.getState().captures.back).toEqual({
        uri: 'file://cropped.jpg',
        width: 200,
        height: 126,
      });
      expect(mockBack).toHaveBeenCalledTimes(1);
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it('Use Photo returns to the ID summary after the single Passport identity-page step', async () => {
      mockSearchParams = { idType: 'Passport', stepId: 'identity-page' };
      await captureAndReachReview();

      fireEvent.press(screen.getByText('Use Photo'));

      expect(useVerificationStore.getState().captures['identity-page']).toEqual({
        uri: 'file://cropped.jpg',
        width: 200,
        height: 126,
      });
      expect(mockBack).toHaveBeenCalledTimes(1);
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it('Use Photo keeps selfie navigation unchanged', async () => {
      mockSearchParams = { stepId: SELFIE_STEP.id };
      await captureAndReachReview();

      fireEvent.press(screen.getByText('Use Photo'));

      expect(useVerificationStore.getState().captures.selfie).toEqual({
        uri: 'file://cropped.jpg',
        width: 200,
        height: 126,
      });
      expect(mockBack).toHaveBeenCalledTimes(1);
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });

  describe('close button', () => {
    it('discards the in-progress session and dismisses the flow to select-id, even when a capture already exists for the current step', () => {
      setPermission('granted');
      useVerificationStore.setState({
        selectedId: 'National ID (PhilSys/PhilID)',
        captures: { front: { uri: 'file://captured.jpg', width: 400, height: 252 } },
      });
      render(<LiveCapture />);

      fireEvent.press(screen.getByTestId('close-button'));

      expect(useVerificationStore.getState()).toEqual(
        expect.objectContaining(initialVerificationState),
      );
      expect(mockDismissTo).toHaveBeenCalledWith('/(auth)/verify-account/select-id');
      expect(mockBack).not.toHaveBeenCalled();
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });
});
