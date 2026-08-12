import { act, renderHook } from '@testing-library/react-native';

import {
  useVerificationStore,
  initialVerificationState,
  type IdCaptureResult,
} from '@/stores/useVerificationStore';

describe('useVerificationStore', () => {
  beforeEach(() => {
    act(() => {
      useVerificationStore.getState().reset();
    });
  });

  it('setCaptureResult stores a result under the given stepId', () => {
    const { result } = renderHook(() => useVerificationStore());

    const front: IdCaptureResult = { uri: 'file://front-1.jpg', width: 100, height: 100 };
    act(() => result.current.setCaptureResult('front', front));

    expect(result.current.captures.front).toEqual(front);
  });

  it('setCaptureResult overwrites an existing result at the same stepId on a second call', () => {
    const { result } = renderHook(() => useVerificationStore());

    act(() =>
      result.current.setCaptureResult('front', { uri: 'file://front-1.jpg', width: 100, height: 100 }),
    );

    const replacement: IdCaptureResult = { uri: 'file://front-2.jpg', width: 200, height: 200 };
    act(() => result.current.setCaptureResult('front', replacement));

    expect(result.current.captures.front).toEqual(replacement);
  });

  it('setCaptureResult for a different stepId leaves other keys untouched', () => {
    const { result } = renderHook(() => useVerificationStore());

    const front: IdCaptureResult = { uri: 'file://front.jpg', width: 100, height: 100 };
    const back: IdCaptureResult = { uri: 'file://back.jpg', width: 100, height: 100 };

    act(() => result.current.setCaptureResult('front', front));
    act(() => result.current.setCaptureResult('back', back));

    expect(result.current.captures).toEqual({ front, back });
  });

  it('clearCaptureResult removes the entry for the given stepId and leaves other keys untouched', () => {
    const { result } = renderHook(() => useVerificationStore());

    const front: IdCaptureResult = { uri: 'file://front.jpg', width: 100, height: 100 };
    const back: IdCaptureResult = { uri: 'file://back.jpg', width: 100, height: 100 };

    act(() => result.current.setCaptureResult('front', front));
    act(() => result.current.setCaptureResult('back', back));

    act(() => result.current.clearCaptureResult('front'));

    expect(result.current.captures).toEqual({ back });
  });

  it('reset() clears selectedId and captures back to initialVerificationState', () => {
    const { result } = renderHook(() => useVerificationStore());

    act(() => {
      result.current.setSelectedId('Driver’s License');
      result.current.setCaptureResult('front', { uri: 'file://front.jpg', width: 100, height: 100 });
      result.current.setCaptureResult('back', { uri: 'file://back.jpg', width: 100, height: 100 });
    });

    act(() => result.current.reset());

    expect(result.current.selectedId).toBe(initialVerificationState.selectedId);
    expect(result.current.captures).toEqual(initialVerificationState.captures);
  });
});
