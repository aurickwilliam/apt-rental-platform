import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import LiveCapture from './live-capture';
import { useVerificationStore, initialVerificationState } from '@/stores/useVerificationStore';
import { useCameraPermission, useFrameQualityCheck } from '@/hooks/verification';

jest.mock('@/hooks/useTheme', () => ({
  useColors: () => ({
    colors: { white: '#FFFFFF', textPrimary: '#333333', primary: '#376BF5' },
    isDark: false,
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, push: jest.fn(), replace: jest.fn() }),
  useLocalSearchParams: jest.fn(() => ({ field: 'front' })),
}));

jest.mock('@/hooks/verification', () => ({
  useCameraPermission: jest.fn(),
  useFrameQualityCheck: jest.fn(),
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
      <TouchableOpacity onPress={onPress}>{children}</TouchableOpacity>
    ),
  };
});

const DEFAULT_QUALITY_RESULT = { status: 'evaluating' as const, reasons: [], isStable: false };

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
    mockTakePictureAsync = jest.fn().mockResolvedValue({ uri: 'file://captured.jpg', width: 400, height: 252 });
    (useFrameQualityCheck as jest.Mock).mockReturnValue(DEFAULT_QUALITY_RESULT);
    useVerificationStore.setState({ ...initialVerificationState });
  });

  describe('permission branches', () => {
    it('denied → renders explanation and a settings-link control (Req 3.1)', () => {
      setPermission('denied');
      render(<LiveCapture />);

      expect(screen.getByText(/Camera access is required/i)).toBeTruthy();
      expect(screen.getByText('Open Settings')).toBeTruthy();
    });

    it('tapping the settings control calls openSettings (Req 3.2)', () => {
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

    it('restricted → renders explanation with no settings-link control (Req 3.6)', () => {
      setPermission('restricted');
      render(<LiveCapture />);

      expect(screen.getByText(/blocked by device policy/i)).toBeTruthy();
      expect(screen.queryByText('Open Settings')).toBeNull();
    });

    it('undetermined → requestPermission is called automatically on mount (Req 3.4)', () => {
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

  describe('camera error handling (Req 2.10)', () => {
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

  describe('manual shutter and auto-capture (Req 2.5, 2.6)', () => {
    it('manual shutter capture calls takePictureAsync regardless of status', async () => {
      setPermission('granted');
      (useFrameQualityCheck as jest.Mock).mockReturnValue({ status: 'fail', reasons: ['blur'], isStable: false });
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

    it('auto-capture triggers once isStable becomes true', async () => {
      setPermission('granted');
      (useFrameQualityCheck as jest.Mock).mockReturnValue({ status: 'pass', reasons: [], isStable: true });

      render(<LiveCapture />);

      act(() => {
        latestCameraProps.onCameraReady();
      });

      await waitFor(() => expect(mockTakePictureAsync).toHaveBeenCalledTimes(1));
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

  describe('capture review (Req 2.7, 2.8, 2.9)', () => {
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

    it('Retake discards the captured image and returns to the camera preview, re-enabling quality sampling', async () => {
      await captureAndReachReview();

      fireEvent.press(screen.getByText('Retake'));

      expect(screen.queryByTestId('captured-image-preview')).toBeNull();
      expect(screen.getByTestId('camera-view')).toBeTruthy();
    });

    it('a second auto-capture can occur after Retake (guard reset)', async () => {
      setPermission('granted');
      (useFrameQualityCheck as jest.Mock).mockReturnValue({ status: 'pass', reasons: [], isStable: true });

      render(<LiveCapture />);
      act(() => {
        latestCameraProps.onCameraReady();
      });
      await waitFor(() => expect(mockTakePictureAsync).toHaveBeenCalledTimes(1));

      fireEvent.press(screen.getByText('Retake'));
      act(() => {
        latestCameraProps.onCameraReady();
      });

      await waitFor(() => expect(mockTakePictureAsync).toHaveBeenCalledTimes(2));
    });

    it('Use Photo commits the expected IdCaptureResult via setFrontResult for field=front', async () => {
      await captureAndReachReview();

      fireEvent.press(screen.getByText('Use Photo'));

      expect(useVerificationStore.getState().frontResult).toEqual({
        kind: 'camera',
        asset: { uri: 'file://captured.jpg', width: 400, height: 252 },
      });
      expect(mockBack).toHaveBeenCalledTimes(1);
    });
  });
});
