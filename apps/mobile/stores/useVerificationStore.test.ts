import { act, renderHook } from '@testing-library/react-native';

import {
  useVerificationStore,
  initialVerificationState,
  type IdCaptureResult,
} from './useVerificationStore';

describe('useVerificationStore', () => {
  beforeEach(() => {
    act(() => {
      useVerificationStore.getState().reset();
    });
  });

  it('overwrites an already-persisted documentFormat when setDocumentFormat is called again (Req 1.7)', () => {
    const { result } = renderHook(() => useVerificationStore());

    act(() => result.current.setDocumentFormat('physical'));
    expect(result.current.documentFormat).toBe('physical');

    act(() => result.current.setDocumentFormat('digital'));
    expect(result.current.documentFormat).toBe('digital');
  });

  it('setFrontResult stores and replaces the front result (Req 2.9, 4.4)', () => {
    const { result } = renderHook(() => useVerificationStore());

    const camera: IdCaptureResult = {
      kind: 'camera',
      asset: { uri: 'file://front-1.jpg', width: 100, height: 100 },
    };
    act(() => result.current.setFrontResult(camera));
    expect(result.current.frontResult).toEqual(camera);

    const replacement: IdCaptureResult = {
      kind: 'camera',
      asset: { uri: 'file://front-2.jpg', width: 200, height: 200 },
    };
    act(() => result.current.setFrontResult(replacement));
    expect(result.current.frontResult).toEqual(replacement);
  });

  it('setBackResult stores and replaces the back result (Req 2.9, 4.4)', () => {
    const { result } = renderHook(() => useVerificationStore());

    const image: IdCaptureResult = {
      kind: 'image',
      asset: { uri: 'file://back-1.jpg', width: 100, height: 100 } as never,
    };
    act(() => result.current.setBackResult(image));
    expect(result.current.backResult).toEqual(image);

    act(() => result.current.setBackResult(null));
    expect(result.current.backResult).toBeNull();
  });

  it('reset() clears documentFormat, frontResult, and backResult back to initial state', () => {
    const { result } = renderHook(() => useVerificationStore());

    act(() => {
      result.current.setSelectedId('Driver License');
      result.current.setDocumentFormat('physical');
      result.current.setFrontResult({
        kind: 'camera',
        asset: { uri: 'file://front.jpg', width: 100, height: 100 },
      });
      result.current.setBackResult({
        kind: 'camera',
        asset: { uri: 'file://back.jpg', width: 100, height: 100 },
      });
    });

    act(() => result.current.reset());

    expect(result.current.selectedId).toBe(initialVerificationState.selectedId);
    expect(result.current.documentFormat).toBe(initialVerificationState.documentFormat);
    expect(result.current.frontResult).toBe(initialVerificationState.frontResult);
    expect(result.current.backResult).toBe(initialVerificationState.backResult);
  });
});
