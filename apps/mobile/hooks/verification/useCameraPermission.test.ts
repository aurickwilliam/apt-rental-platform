import { renderHook } from '@testing-library/react-native';
import { Linking } from 'react-native';
import { useCameraPermissions } from 'expo-camera';
import { useFocusEffect } from 'expo-router';

import { useCameraPermission } from './useCameraPermission';

jest.mock('expo-camera', () => ({
  useCameraPermissions: jest.fn(),
}));

jest.mock('expo-router', () => ({
  useFocusEffect: jest.fn(),
}));

jest.mock('react-native', () => {
  const actual = jest.requireActual('react-native');
  actual.Linking.openSettings = jest.fn();
  return actual;
});

describe('useCameraPermission', () => {
  const mockRequest = jest.fn();
  const mockGet = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useFocusEffect as jest.Mock).mockImplementation((callback: () => void) => {
      callback();
    });
  });

  const mockPermissionResponse = (
    response: { status: 'granted' | 'denied' | 'undetermined'; canAskAgain: boolean } | null,
  ) => {
    (useCameraPermissions as jest.Mock).mockReturnValue([
      response ? { ...response, granted: response.status === 'granted', expires: 'never' } : null,
      mockRequest,
      mockGet,
    ]);
  };

  it('maps a granted response to state "granted" (Req 3.1)', () => {
    mockPermissionResponse({ status: 'granted', canAskAgain: true });
    const { result } = renderHook(() => useCameraPermission());
    expect(result.current.state).toBe('granted');
  });

  it('maps a denied response with canAskAgain=true to state "denied" (Req 3.1)', () => {
    mockPermissionResponse({ status: 'denied', canAskAgain: true });
    const { result } = renderHook(() => useCameraPermission());
    expect(result.current.state).toBe('denied');
  });

  it('maps a denied response with canAskAgain=false to state "restricted" (Req 3.6)', () => {
    mockPermissionResponse({ status: 'denied', canAskAgain: false });
    const { result } = renderHook(() => useCameraPermission());
    expect(result.current.state).toBe('restricted');
  });

  it('does NOT map denied+canAskAgain=true to "restricted" (Req 3.6 negative case)', () => {
    mockPermissionResponse({ status: 'denied', canAskAgain: true });
    const { result } = renderHook(() => useCameraPermission());
    expect(result.current.state).not.toBe('restricted');
  });

  it('maps an undetermined response to state "undetermined" (Req 3.4)', () => {
    mockPermissionResponse({ status: 'undetermined', canAskAgain: true });
    const { result } = renderHook(() => useCameraPermission());
    expect(result.current.state).toBe('undetermined');
  });

  it('maps a null response (not yet resolved) to state "undetermined"', () => {
    mockPermissionResponse(null);
    const { result } = renderHook(() => useCameraPermission());
    expect(result.current.state).toBe('undetermined');
  });

  it('openSettings invokes Linking.openSettings() (Req 3.2)', () => {
    mockPermissionResponse({ status: 'denied', canAskAgain: true });
    const { result } = renderHook(() => useCameraPermission());

    result.current.openSettings();

    expect(Linking.openSettings).toHaveBeenCalledTimes(1);
  });

  it('requestPermission calls the underlying requestCameraPermission function', async () => {
    mockPermissionResponse({ status: 'undetermined', canAskAgain: true });
    const { result } = renderHook(() => useCameraPermission());

    await result.current.requestPermission();

    expect(mockRequest).toHaveBeenCalledTimes(1);
  });

  it('re-checks permission state on focus via useFocusEffect (Req 3.3)', () => {
    mockPermissionResponse({ status: 'granted', canAskAgain: true });
    renderHook(() => useCameraPermission());

    expect(useFocusEffect).toHaveBeenCalledTimes(1);
    expect(mockGet).toHaveBeenCalledTimes(1);
  });
});
