import { renderHook, waitFor, act } from '@testing-library/react-native';

import {
  useFrameQualityCheck,
  evaluateBlurHeuristic,
  evaluateGlareHeuristic,
  BLUR_EXPOSURE_TIME_THRESHOLD_SECONDS,
  GLARE_BRIGHTNESS_MIN,
  GLARE_BRIGHTNESS_MAX,
} from '@/hooks/verification/useFrameQualityCheck';

jest.mock('expo-image-manipulator', () => ({
  SaveFormat: { JPEG: 'jpeg' },
  ImageManipulator: {
    manipulate: jest.fn(() => ({
      resize: jest.fn(),
      renderAsync: jest.fn().mockResolvedValue({
        saveAsync: jest.fn().mockResolvedValue({ uri: 'file://sample.jpg' }),
      }),
    })),
  },
}));

const GUIDED_FRAME_RECT = { x: 10, y: 10, width: 100, height: 63 };
const VIEWPORT = { viewportWidth: 200, viewportHeight: 200 };

function createCameraRef(takePictureAsync: jest.Mock) {
  return { current: { takePictureAsync } } as unknown as React.RefObject<any>;
}

describe('evaluateBlurHeuristic', () => {
  it('passes when ExposureTime is at or below the threshold', () => {
    expect(evaluateBlurHeuristic({ ExposureTime: BLUR_EXPOSURE_TIME_THRESHOLD_SECONDS })).toBe(true);
    expect(evaluateBlurHeuristic({ ExposureTime: BLUR_EXPOSURE_TIME_THRESHOLD_SECONDS - 0.001 })).toBe(true);
  });

  it('fails when ExposureTime is above the threshold', () => {
    expect(evaluateBlurHeuristic({ ExposureTime: BLUR_EXPOSURE_TIME_THRESHOLD_SECONDS + 0.001 })).toBe(false);
  });

  it('passes (no signal) when ExposureTime is absent', () => {
    expect(evaluateBlurHeuristic({})).toBe(true);
  });
});

describe('evaluateGlareHeuristic', () => {
  it('passes within the expected brightness band', () => {
    expect(evaluateGlareHeuristic({ BrightnessValue: GLARE_BRIGHTNESS_MIN })).toBe(true);
    expect(evaluateGlareHeuristic({ BrightnessValue: GLARE_BRIGHTNESS_MAX })).toBe(true);
  });

  it('fails outside the expected brightness band', () => {
    expect(evaluateGlareHeuristic({ BrightnessValue: GLARE_BRIGHTNESS_MIN - 0.001 })).toBe(false);
    expect(evaluateGlareHeuristic({ BrightnessValue: GLARE_BRIGHTNESS_MAX + 0.001 })).toBe(false);
  });

  it('passes (no signal) when BrightnessValue is absent', () => {
    expect(evaluateGlareHeuristic({})).toBe(true);
  });
});

describe('useFrameQualityCheck', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  const passingPicture = { uri: 'file://still.jpg', exif: {} };

  it('becomes stable only after stableDurationMs of consecutive passing samples', async () => {
    const takePictureAsync = jest.fn().mockResolvedValue(passingPicture);
    const cameraRef = createCameraRef(takePictureAsync);

    const { result } = renderHook(() =>
      useFrameQualityCheck(cameraRef, {
        enabled: true,
        sampleIntervalMs: 200,
        stableDurationMs: 1000,
        guidedFrameRect: GUIDED_FRAME_RECT,
        ...VIEWPORT,
      }),
    );

    for (let i = 0; i < 7; i++) {
      await act(async () => {
        jest.advanceTimersByTime(200);
        await Promise.resolve();
        await Promise.resolve();
      });
    }

    await waitFor(() => expect(result.current.status).toBe('pass'));
    expect(result.current.isStable).toBe(true);
  });

  it('resets stability on an interleaved failing sample', async () => {
    let call = 0;
    const takePictureAsync = jest.fn().mockImplementation(() => {
      call += 1;
      // 3rd sample fails (glare), rest pass.
      if (call === 3) {
        return Promise.resolve({ uri: 'file://still.jpg', exif: { BrightnessValue: 100 } });
      }
      return Promise.resolve(passingPicture);
    });
    const cameraRef = createCameraRef(takePictureAsync);

    const { result } = renderHook(() =>
      useFrameQualityCheck(cameraRef, {
        enabled: true,
        sampleIntervalMs: 200,
        stableDurationMs: 1000,
        guidedFrameRect: GUIDED_FRAME_RECT,
        ...VIEWPORT,
      }),
    );

    for (let i = 0; i < 3; i++) {
      await act(async () => {
        jest.advanceTimersByTime(200);
        await Promise.resolve();
        await Promise.resolve();
      });
    }

    await waitFor(() => expect(result.current.status).toBe('fail'));
    expect(result.current.isStable).toBe(false);
    expect(result.current.reasons).toContain('glare');
  });

  it('does not sample while options.enabled is false', async () => {
    const takePictureAsync = jest.fn().mockResolvedValue(passingPicture);
    const cameraRef = createCameraRef(takePictureAsync);

    renderHook(() =>
      useFrameQualityCheck(cameraRef, {
        enabled: false,
        sampleIntervalMs: 200,
        guidedFrameRect: GUIDED_FRAME_RECT,
        ...VIEWPORT,
      }),
    );

    await act(async () => {
      jest.advanceTimersByTime(2000);
      await Promise.resolve();
    });

    expect(takePictureAsync).not.toHaveBeenCalled();
  });

  it('applies a concurrency guard: a slow in-flight sample blocks a second call until it resolves', async () => {
    let resolveFirst: (value: typeof passingPicture) => void = () => {};
    const takePictureAsync = jest.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFirst = resolve;
        }),
    );
    const cameraRef = createCameraRef(takePictureAsync);

    renderHook(() =>
      useFrameQualityCheck(cameraRef, {
        enabled: true,
        sampleIntervalMs: 200,
        guidedFrameRect: GUIDED_FRAME_RECT,
        ...VIEWPORT,
      }),
    );

    // First tick dispatches a sample that never resolves yet.
    await act(async () => {
      jest.advanceTimersByTime(200);
      await Promise.resolve();
    });
    expect(takePictureAsync).toHaveBeenCalledTimes(1);

    // Second tick fires while the first is still in flight — must be skipped.
    await act(async () => {
      jest.advanceTimersByTime(200);
      await Promise.resolve();
    });
    expect(takePictureAsync).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveFirst(passingPicture);
      await Promise.resolve();
      await Promise.resolve();
    });

    // Next tick after the in-flight sample resolved is free to sample again.
    await act(async () => {
      jest.advanceTimersByTime(200);
      await Promise.resolve();
    });
    expect(takePictureAsync).toHaveBeenCalledTimes(2);
  });

  it('clears the interval on unmount — no further takePictureAsync calls occur', async () => {
    const takePictureAsync = jest.fn().mockResolvedValue(passingPicture);
    const cameraRef = createCameraRef(takePictureAsync);

    const { unmount } = renderHook(() =>
      useFrameQualityCheck(cameraRef, {
        enabled: true,
        sampleIntervalMs: 200,
        guidedFrameRect: GUIDED_FRAME_RECT,
        ...VIEWPORT,
      }),
    );

    await act(async () => {
      jest.advanceTimersByTime(200);
      await Promise.resolve();
      await Promise.resolve();
    });
    const callsBeforeUnmount = takePictureAsync.mock.calls.length;

    unmount();

    await act(async () => {
      jest.advanceTimersByTime(2000);
      await Promise.resolve();
    });

    expect(takePictureAsync.mock.calls.length).toBe(callsBeforeUnmount);
  });

  it('treats a rejected takePictureAsync as a failing sample without throwing, and continues sampling', async () => {
    const takePictureAsync = jest
      .fn()
      .mockRejectedValueOnce(new Error('camera error'))
      .mockResolvedValue(passingPicture);
    const cameraRef = createCameraRef(takePictureAsync);

    const { result } = renderHook(() =>
      useFrameQualityCheck(cameraRef, {
        enabled: true,
        sampleIntervalMs: 200,
        guidedFrameRect: GUIDED_FRAME_RECT,
        ...VIEWPORT,
      }),
    );

    await act(async () => {
      jest.advanceTimersByTime(200);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(result.current.status).toBe('fail');

    await act(async () => {
      jest.advanceTimersByTime(200);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(result.current.status).toBe('pass');
    expect(takePictureAsync).toHaveBeenCalledTimes(2);
  });

  it('skips the tick (stays evaluating, not fail) when cameraRef.current is null', async () => {
    const cameraRef = { current: null } as unknown as React.RefObject<any>;

    const { result } = renderHook(() =>
      useFrameQualityCheck(cameraRef, {
        enabled: true,
        sampleIntervalMs: 200,
        guidedFrameRect: GUIDED_FRAME_RECT,
        ...VIEWPORT,
      }),
    );

    await act(async () => {
      jest.advanceTimersByTime(200);
      await Promise.resolve();
    });

    expect(result.current.status).toBe('evaluating');
  });
});
